// ===== SUPER CAT WORLD — Platformer Engine =====
(function () {
    'use strict';
    const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const livesEl = document.getElementById('lives-display'), coinEl = document.getElementById('coin-display');
    const scoreEl = document.getElementById('score-display'), levelEl = document.getElementById('level-display');
    const overlay = document.getElementById('overlay'), overlayTitle = document.getElementById('overlay-title');
    const overlaySub = document.getElementById('overlay-sub');

    // CONSTANTS
    const T = 32, GRAVITY = 0.55, MAX_FALL = 10, JUMP = -15, WALK = 3.5, COLS = Math.ceil(W / T) + 2;
    const ENEMY_SPEED = 1.2, COIN_ANIM = 0.08;

    // TILE TYPES: 0=air,1=ground,2=brick,3=question,4=pipe_tl,5=pipe_tr,6=pipe_bl,7=pipe_br,8=used_q,9=platform,10=flag
    const TILE_COLORS = {
        1: ['#8B5E3C', '#6B3F1F'], 2: ['#C84B31', '#A03820'], 3: ['#FFD700', '#DAA520'],
        4: ['#2E8B57', '#1E6B3A'], 5: ['#2E8B57', '#1E6B3A'], 6: ['#3CB371', '#2E8B57'], 7: ['#3CB371', '#2E8B57'],
        8: ['#8B7355', '#6B5335'], 9: ['#A0826D', '#8B6F5C'], 10: ['#C0C0C0', '#A0A0A0'],
        11: ['#3A3A4A', '#2A2A3A'], 12: ['#4A3A2A', '#3A2A1A'], // 11=castle wall, 12=castle door
        13: ['#FFD700', '#DAA520'] // 13=rare question block
    };

    // LEVELS (each row is a horizontal row; stored top-to-bottom)
    const LEVEL_H = 14, LEVEL_DATA = [
        // Level 1 — Intro
        [
            "                                                                                                                          F         ",
            "                                                                                                                          |         ",
            "                                                                                                                          |         ",
            "                                                                                                                          |         ",
            "                                                                                                                          |         ",
            "                      CCC                                                                                                 |         ",
            "                   BBBBBBB          C  C  C                        C                     L                                |         ",
            "            C                                     C C C                     CCC                                           |         ",
            "         Q    Q                 BBBBBBBBB       BBBBBBBZ          BBBBB                                                   |         ",
            "                    C        W                              H                              BB QBB                         |         ",
            "  S     V        GGGGG    GG    V    R       GG    V     R    GG   V    GGGG    GG   V    GGGGGGGGG  GG V GGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGG  GGGGG  GGGGGGGGGGGGGGG     GGGGGGGGGGGGGG      GGGGGGGGGGG  GGGGGGGGGGGGGGG    GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGG  GGGGG  GGGGGGGGGGGGGGGGGG  GGGGGGGGGGGGGGGGGG  GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGG  GGGGG  GGGGGGGGGGGGGGGGGG  GGGGGGGGGGGGGGGGGG  GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        ],
        // Level 2 — Gaps and more enemies
        [
            "                                                                                                                            F       ",
            "                                                                                                                            |       ",
            "                                                                                                                            |       ",
            "                                                                                                                            |       ",
            "                         C C C                                         CCC                                                  |       ",
            "                        BBBBBBB                C                      BBBBB             C   C                               |       ",
            "            CC                        C C   Q              C                     L                       CCC               |       ",
            "          QBBBBQ        W     R    BBBBBBBBB         R          R  BBB    BBZ       BBBBBBB                                 |       ",
            "                           GGGGG              GGGGG      GGGGG              GG           R      Q  BBBBBB              |       ",
            "  S        R    V      GG  V    GG  H R    V  GG     V GG    V    A    GGGGG     V  GGGGG    A  GG          GGGG          |       ",
            "GGGGG   GGGGG   GG  GGGG        GGGGGGGG  GGGGG          GGG    GGGG         GGG          GGG       GGGGG       GGGGGGGGGGGGGGGGGGG",
            "GGGGG   GGGGG   GGGGGGGG        GGGGGGGG  GGGGG          GGG    GGGG         GGG          GGG       GGGGG       GGGGGGGGGGGGGGGGGGG",
            "GGGGG   GGGGG   GGGGGGGG        GGGGGGGG  GGGGG          GGG    GGGG         GGG          GGG       GGGGG       GGGGGGGGGGGGGGGGGGG",
            "GGGGG   GGGGG   GGGGGGGG        GGGGGGGG  GGGGG          GGG    GGGG         GGG          GGG       GGGGG       GGGGGGGGGGGGGGGGGGG",
        ],
        // Level 3 — Hard
        [
            "                                                                                                                                                          ",
            "                                                                                                                                                          ",
            "                                                                                                                                    K K K                 ",
            "                  C                                                                     CCC                                         KKKKK                 ",
            "                                     C C                           C  C  C           Q BBBBB          L                              KK KK                 ",
            "         C C C  BBQ           CCC   BBBBB     C           CCC              H                         C                            KKKKKKKKK                ",
            "        BBBBBBB          W                       Q BBBBB                BBBBB                    BBBZBBB   C                     K KKKKKKK K               ",
            "                    GGGGG    V GGGGG     R     V  GGGGG    R   V  GGG    R  GGG V GGGGG    V        BBB                         KKKKKKKKKKK               ",
            "  S     V        GG      GG     V    GGG   GGGGG  GGG    V  GG    GG    V  GGG    V  GG  A  GG   V  GG     GGGGGF|GGGGGGGGGGGGGKKKK  D  KKKK              ",
            "GGGGG  GGG  GG    R  R        GGG                                                                     R    GGGGG||GGGGGGGGGGGGGKKKKKKKKKKKKK              ",
            "GGGGG  GGG  GGG    GGGGG   GGGGG   GGGGG    GGGG   GGGGG    GGG   GGGGG   GGG    GGGGG   GGG    GGG   GGGGGGGGGGGGGGGGGGGGGKK D KKK D KKK D KK           ",
            "GGGGG  GGG  GGG    GGGGG   GGGGG   GGGGG    GGGG   GGGGG    GGG   GGGGG   GGG    GGGGG   GGG    GGG   GGGGGGGGGGGGGGGGGGGGGKKKKKKKKKKKKKKKKKKKKK          ",
            "GGGGG  GGG  GGG    GGGGG   GGGGG   GGGGG    GGGG   GGGGG    GGG   GGGGG   GGG    GGGGG   GGG    GGG   GGGGGGGGGGGGGGGGGGGGGKKKKKKKKKKKKKKKKKKKKK          ",
            "GGGGG  GGG  GGG    GGGGG   GGGGG   GGGGG    GGGG   GGGGG    GGG   GGGGG   GGG    GGGGG   GGG    GGG   GGGGGGGGGGGGGGGGGGGGGKKKKKKKKKKKKKKKKKKKKK          ",
        ],
        // Level 4 — Castle Interior (platforming)
        [
            "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
            "K                                                                                              K",
            "K                     C  C  C                                                                  K",
            "K                    KKKKKKKK                C C C                           CCC               K",
            "K                                           KKKKKKKK        C  C           KKKKKKKK   C        K",
            "K  C  C   KKKK   V         C  C        V           KKK             C C    V        KKK       K",
            "K        R    R       KKK   KKKKKK     R    V    KKKK   R    H   KKKKKKKK   V   R              K",
            "K    KKKKKKKKKK     V    R        KKKKKKKK   KKKK    V    KKKK          KKKK    KKKK    V      K",
            "K                KKKK                           R                  R                    DDDDDDDK",
            "K           R        KKKK    C  L     KKK   KKKKKKKK        KKKK      KKKK    W    KKKKDDDDDDDK",
            "K S      KKKKKK          KKKKKKKKK        R                     KKKK       KKKKKKKKKKKKDDDDDDDK",
            "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
            "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
            "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
        ],
        // Level 5 — BOSS ARENA (Castle Interior)
        [
            "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
            "K                                                K",
            "K                                                K",
            "K                                                K",
            "K                                                K",
            "K         KKKK                        KKKK       K",
            "K                      KKKK                      K",
            "K W                                           X  K",
            "K                KK          KK                  K",
            "K                                                K",
            "K S                                              K",
            "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
            "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
            "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
        ],
        // Level 6 — Sky Islands: The Ascent
        [
            "                                                                                                                          F         ",
            "                                                                                                                          |         ",
            "                                                                                                                          |         ",
            "                                                                                                                          |         ",
            "                                                                     C C C          H                                    |         ",
            "                                                                    BBBBBBB                   C C                         |         ",
            "                       C C C      Y        C C           Y                    C C C       BBBBB         Y                  |         ",
            "             C C      BBBBBBB             BBBBB      C  C          BBBBB         BBBBBBB                                   |         ",
            "            BBBBB       V        R    V  R      R   BBBBBBB  V R         V                           C C C                |         ",
            "                          BBB        BBB                             BBB     BBB              BBB    BBBBBBB               |         ",
            "  S      BBBBB                                        BBBBB                              BBB                        BBBBBBBBBBBBBBBBBBBB",
            "BBBBB                  BBB        BBB                          BBB       BBBBB                   BBBB                              ",
            "                                                                                                                                   ",
            "                                                                                                                                   ",
        ],
        // Level 7 — Sky Islands: Pirate Ship
        [
            "                                                                                                                          F         ",
            "                                                                        BBBBB                                             |         ",
            "                                                                     C  B   B                                             |         ",
            "                                                                     C  B   B  C C                                        |         ",
            "                                              C C C                     B   B BBBBB                                       |         ",
            "                     C C          Y       BBBBBBB                    BBBBB            Y     C C C                       |         ",
            "            C C     BBBBB        C C                      BBBBB                    BBBBB      BBBBBBB     C   C           |         ",
            "           BBBBB     V    R     BBBBB   V R     V    R     V    R  C C    V    R              R       R  BBBBB            |         ",
            "                     BBB             BBB       BBB          BBB      BBBBB         BBB    BBB                    BBBBBBBBBBBBBBBBBBB",
            "  S      BBBBB                                                        H                             BBBB                            ",
            "BBBBB                  BBB        BBB        BBB        BBB         BBBBB       BBB                                                  ",
            "                                                                                                                                   ",
            "                                                                                                                                   ",
            "                                                                                                                                   ",
        ],
        // Level 8 — Sky Islands: Twin Ships
        [
            "                                                                                                                          F         ",
            "                 BBBBB                                               BBBBB                                                |         ",
            "              C  B   B                              L             C   B   B                                                |         ",
            "              C  B   B  C C                         C             C   B   B   C C                                          |         ",
            "                 B   B BBBBB              C C C                       B   B  BBBBB                                         |         ",
            "                 BBBBB             R     BBBBBBB    W                 BBBBB                    C C C                       |         ",
            "          C C        Y     BBB               Y          BBBBB            Y        BBBBB       BBBBBBB     C C              |         ",
            "         BBBBB    V  R     V    R   BBB    V  R       V       R  BBB    V  R           R              BBBBB               |         ",
            "                 BBB     BBB                BBB     BBB                 BBB      BBB              BBB           BBBBBBBBBBBBBBBBBBBBB",
            "  S     BBBBB                                                  H                                            BBBB                    ",
            "BBBBB                BBB       BBB       BBB       BBB       BBBBB     BBB       BBB       BBB                                      ",
            "                                                                                                                                   ",
            "                                                                                                                                   ",
            "                                                                                                                                   ",
        ],
        // Level 9 — Sky Islands: The Armada
        [
            "                                                                                                                          F         ",
            "                                  BBBBB                                         BBBBB                                     |         ",
            "               BBBBB           C  B   B      C C C                           C  B   B                                     |         ",
            "            C  B   B           C   B   B     BBBBBBB        BBBBB            C   B   B    C C                              |         ",
            "            C  B   B               B   B                    B   B                B   B   BBBBB                             |         ",
            "               B   B     R         BBBBB     R          C   B   B   R            BBBBB                  C C C              |         ",
            "               BBBBB    Y   BBB               Y   BBB   C   BBBBB    Y  BBB                BBBBB      BBBBBBB             |         ",
            "         R     V     R       V          R BBB    V        W         V            R     V   R          R         |         ",
            "            BBB          BBB       BBB             BBB        BBB        BBB       BBB       BBB       BBB        BBBBBBBBBBBBBBBBBBB",
            "  S     BBBBB                                                   H                                             BBBB                  ",
            "BBBBB              BBB        BBB        BBB        BBB        BBBBB      BBB        BBB        BBB                                  ",
            "                                                                                                                                   ",
            "                                                                                                                                   ",
            "                                                                                                                                   ",
        ],
        // Level 10 — Sky Islands: The Final Island
        [
            "                                                                                                                          F         ",
            "                                                                                                                          |         ",
            "                                                                                                             BBBBB        |         ",
            "                                                       C C C                                              C  B   B        |         ",
            "                                   C  C  C            BBBBBBB      L                   C C C              C  B   B        |         ",
            "             C C C                BBBBBBB        R               BBBBB                BBBBBBB    C C         B   B        |         ",
            "     C C    BBBBBBB     Y    W               Y       BBBBB                  Y    R               BBBBB       BBBBB        |         ",
            "    BBBBB        V     R     V  BBBBB    V  R          V     BBB     V  R   BBB      V    R                               |         ",
            "                  BBB       BBB                  BBB              BBB             BBB          BBB        BBBBBBBBBBBBBBBBBBBBBBBBBBB",
            "  S     BBBBB                                                  H                                      BBBB                         ",
            "BBBBB              BBB        BBB        BBB        BBB        BBBBB      BBB        BBB        BBB                                  ",
            "                                                                                                                                   ",
            "                                                                                                                                   ",
            "                                                                                                                                   ",
        ],
        // Level 11 — PIRATE CAPTAIN'S FLAGSHIP (Sky Boss Arena)
        [
            "                                                                                                    ",
            "                                                                                                    ",
            "                                                                                                    ",
            "                                                                                                    ",
            "                                                                                                    ",
            "            BBBBB                                                          BBBBB                    ",
            "                                        BBBBB                                                       ",
            "  W                                                                                            X    ",
            "                    BB              BB              BB              BB                               ",
            "                                                                                                    ",
            "  S                                                                                                 ",
            "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
            "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
            "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
        ],
        // Level 12 — Cave 1: The Descent
        [
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "G                                                                                                   G",
            "G                                                                                                   G",
            "G  S         C C C              C C             R                    C C C                           G",
            "G          GGGGGGG         R   GGGGG          GGGGG      C C        GGGGGGG         C C C       F    G",
            "G     R    V                  GG    V     GG     V   GG  GGGGG    V         R   V  GGGGGGG         C C C       F    G",
            "G   GGGGG        GGG     GGG      GGG          GGG          GGG     GGG       GGG                   G",
            "G                                                                                               |    G",
            "G         GG           GG          GG   H       GG           GG          GG          GG         |    G",
            "G                                                                                               |    G",
            "G   C          C          C           C            C            C           C                   |    G",
            "G  GGG   GGG  GGG   GGG  GGG   GGG  GGG   GGG   GGG   GGG   GGG   GGG  GGG   GGG  GGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        ],
        // Level 13 — Cave 2: Crystal Cavern
        [
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "G                                                                                             G",
            "G  S       C     C C      R        C C C        W                C C         R                G",
            "G        GGGGG  GGGGG         GGGGGGGGG      GGGGG      Q     GGGGGGG       GGG              G",
            "G   R          GG       GGG             GGG        GGGGGGG              GGG       C C    F    G",
            "G GGGGG    V           V    R       V              V                     V    R    GGGGG   |    G",
            "G            GGG      GGG     GGGGG     GGG     GGG      GGG     H   GGG              GGGG   G",
            "G                                                                                             G",
            "G      GG          GG      R      GG          GG          GG          GG          GG          G",
            "G                       GGGGG                                                                 G",
            "G  C        C        C         C         C         C         C         C                      G",
            "G GGG  GGG GGG  GGG GGG  GGG GGG  GGG  GGG  GGG GGG  GGG GGG  GGG  GGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        ],
        // Level 14 — Cave 3: Lava Bridge
        [
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "G                                                                                               G",
            "G  S                 C C C         C  C  C         C C           R                               G",
            "G         R        GGGGGGG       GGGGGGGGG       GGGGG       GGGGG     C C C            F       G",
            "G       GGGGG    V          R       V         R     V   GGG    V  R   GGGGGGG    V      F       G",
            "G                        GGGGG          GGGGG      GGGGG    GGGGG         C      GGGGG  |       G",
            "G   GGG       GGG              GGG            GGG               GGG     GGGGG          |       G",
            "G                    Q               H                                                  |       G",
            "G        GG      GG GGGGG GG      GGGGG    GG      GG      GG      GG      GG  GGGGGGGGGGGGGGGG",
            "G                                                                                               G",
            "G                                                                                               G",
            "G                                                                                               G",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        ],
        // Level 15 — Cave 4: The Maze
        [
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "G                          G           G              G                               G",
            "G  S      C C    G    R    G   C C C   G     W        G    C C C        R             G",
            "G       GGGGG   GG  GGGGG GG GGGGGGG  GG  GGGGG      G  GGGGGGG     GGGGG       F    G",
            "G  R   V                  V                       V               G       V              V      |    G",
            "GGGGGGG   GGG   GG   GGG  GG   GGG   GGG   GGG      G   GGG   GGG   GGG        |    G",
            "G                          G           G              G                H         |    G",
            "G    GGG        GGG        G   GGG     G    GGG   GGGGG  GGG       GGG  GGGGGGGGGGG  G",
            "G                          G           G              G                               G",
            "G  C     C     C     C     G  C     C  G  C     C     G  C     C     C     C          G",
            "G GGG  GGG  GGG   GGG  GGGG GGG  GGG GGG GGG  GGG GGGGGGG  GGG  GGG   GGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        ],
        // Level 16 — Cave 5: Mushroom Grotto
        [
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "G                                                                                         G",
            "G  S      C C C        L        C C C              C C            C C C                    G",
            "G        GGGGGGG    GGGGG      GGGGGGG    R       GGGGG      R   GGGGGGG        C    F    G",
            "G   R    V          V   R    V    GGGGG    V        GGGGG    V         GGG  GGG  |    G",
            "G GGGGG    GGG     GGG  GGGGG    GGG          GGG            GGG     GGG          GGGGG  G",
            "G                                                  H                                      G",
            "G      GG      GG      GG   Q  GG      GG      GGGGG    GG      GG      GG      GG       G",
            "G                          GGGGG                                                          G",
            "G                                                                                         G",
            "G  C     C     C     C     C     C     C     C     C     C     C     C                     G",
            "G GGG  GGG  GGG  GGG  GGG  GGG  GGG  GGG  GGG  GGG  GGG  GGG GGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        ],
        // Level 17 — Cave 6: Deep Tunnels
        [
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "G                                                                                               G",
            "G  S                    C C C               C C C                   C C C            R           G",
            "G           R         GGGGGGG         R    GGGGGGG        W        GGGGGGG        GGGGG     F   G",
            "G  C C   GGGGG   GGG             GGGGG            GGGGG GGGGG              GGG            GGGG  G",
            "G GGGGG      V              GGG    V       GGG    V          GGG   V GGG      GGG V GGG         G",
            "G            GG      R  GG       GG    H      GG       GG       GG       GG      GG  GG        G",
            "G                 GGGGG       GGGGG        GGGGG                                                G",
            "G     GGG    GGG        GGG         GGG          GGG    GGG         GGG    GGG    GGG    GGG    G",
            "G                                                                                               G",
            "G C     C     C     C     C     C     C     C     C     C     C     C     C     C                G",
            "GGGG  GGG  GGG  GGG  GGG  GGG  GGG  GGG  GGG  GGG  GGG  GGG  GGG  GGG  GGG  GGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        ],
        // Level 18 — Cave 7: The Abyss
        [
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "G  S     C C       R                    C C C            L               R                  G",
            "G       GGGGG   GGGGG       C C C      GGGGGGG       GGGGG    C C C   GGGGG    C C     F    G",
            "G                      R   GGGGGGG               R             GGGGG           GGGGG   |    G",
            "G  GGG   V  GGG   GGGGG    V    GGG    GGG  V GGGGG   GGG    V         GGG    V   GGG |    G",
            "G                                                                  H                   |    G",
            "G     GG       GG      GG      GG      GG      GG    GGGGG  GG      GG      GGGGGGGGGGG    G",
            "G                                                                                           G",
            "G        GGG      GGG      GGG     Q     GGG      GGG     GGG     GGG                       G",
            "G                              GGGGGGG                                                      G",
            "G C     C     C     C     C        C        C     C     C     C     C                        G",
            "GGGG  GGG  GGG  GGG  GGG  GGG  GGG  GGG  GGG  GGG  GGG  GGG GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        ],
        // Level 19 — Cave 8: Minecart Run
        [
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "G                                                                                               G",
            "G  S       C C C        C C        R    C C C       C C C        W         C C         R         G",
            "G  R      GGGGGGG     GGGGG     GGGGG GGGGGGG      GGGGGGG    GGGGG      GGGGG     GGGGG   F    G",
            "GGGGGG    V          GGG    V        GGG    V  R     V   GGG    V   GGG    V   GGG       GGGGG  G",
            "G         GGG   GGG       GGG             GGG GGGGG GGG      GGG        GGG        GGG         G",
            "G                              H                                                                G",
            "G    GG      GG   Q  GG      GGGGG    GG      GG      GG      GG      GG      GG      GG       G",
            "G                 GGGGG                                                                         G",
            "G       GGG    GGG      GGG      GGG     GGG      GGG     GGG     GGG     GGG     GGG          G",
            "G                                                                                               G",
            "GG C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  GGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        ],
        // Level 20 — Cave 9: Magma Core
        [
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "G                                                                                         G",
            "G  S       R            C C C        C C          R     C C C          L                   G",
            "G       V   GGGGG     R  V GGGGGGG   V GGGGG    C  GGGGG  GGGGGGG   V  GGGGG    C C  V   F    G",
            "G              GGGGG           R         GGGGG             R             R  GGGGG    |    G",
            "GG GGG     GGG       GGG  GGGGG    GGG       GGG    GGG GGGGG GGG    GGG       GGG |    G",
            "G                                       H                                          |    G",
            "G    GG      GG      GG   Q  GG      GGGGG    GG      GG      GG      GG      GGGGGGG   G",
            "G                         GGGGG                                                          G",
            "G     GGG    GGG     GGG       GGG     GGG      GGG     GGG     GGG     GGG              G",
            "G                                                                                         G",
            "GG C   C   C   C   C   C   C   C   C   C   C   C   C   C   C   C   GGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        ],
        // Level 21 — Cave 10: The Final Depth
        [
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "G                                                                                                   G",
            "G  S      C C C       L       C C C        C C C                C C C         W        C C       F   G",
            "G   R    GGGGGGG   GGGGG     GGGGGGG  R   GGGGGGG     C C     GGGGGGG      GGGGG     GGGGG      |   G",
            "GGGGGGG    V      GGG    V  GGG   V  GGGGG    V   R  GGGGG    V      R  GGG   V  GGG    V   GGG |   G",
            "G        GGG  GGG     GGG        GGG       GGG GGGGG     GGG  GGG GGGGG    GGG       GGG       |   G",
            "G                                                                H                              |   G",
            "G   GG      GG      GG   Q  GG      GG Q    GG      GG      GGGGG   GG      GG      GG   GGGGGG   G",
            "G                        GGGGG       GGGGG                                                          G",
            "G     GGG    GGG    GGG       GGG        GGG    GGG    GGG    GGG    GGG    GGG    GGG    GGG       G",
            "G                                                                                                   G",
            "GGG C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  GGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        ]
    ];

    // Parse level string into grid + entities
    function parseLevel(idx) {
        const raw = LEVEL_DATA[idx];
        const rows = raw.length, cols = raw[0].length;
        const grid = []; const enemies = []; const coins = []; const oneUps = []; const fireFlowers = []; const checkpoints = []; let spawnX = 2, spawnY = 10; let flagX = 0, flagY = 0;
        for (let r = 0; r < rows; r++) {
            grid[r] = [];
            for (let c = 0; c < cols; c++) {
                const ch = raw[r][c] || ' ';
                if (ch === 'G') grid[r][c] = 1;
                else if (ch === 'B') grid[r][c] = 2;
                else if (ch === 'Q') grid[r][c] = 3;
                else if (ch === '9' || ch === 'P') grid[r][c] = 9;
                else if (ch === 'F') { grid[r][c] = 10; flagX = c; flagY = r; }
                else if (ch === '|') { grid[r][c] = 10; }
                else if (ch === 'R') { grid[r][c] = 0; enemies.push({ x: c * T, y: r * T, w: T, h: T, vx: ENEMY_SPEED, type: 'rat', alive: true, frame: 0 }); }
                else if (ch === 'A') { grid[r][c] = 0; enemies.push({ x: c * T, y: r * T, w: T, h: T, vx: 0, type: 'archer', alive: true, frame: 0, shootTimer: 60 + Math.floor(Math.random() * 60), shootCooldown: 120, dir: -1 }); }
                else if (ch === 'V') { grid[r][c] = 0; enemies.push({ x: c * T, y: r * T - 8, w: T, h: 40, vx: ENEMY_SPEED * 0.7, type: 'ratter', alive: true, frame: 0, shell: false, shellVx: 0 }); }
                else if (ch === 'Y') { grid[r][c] = 0; enemies.push({ x: c * T, y: r * T - 8, w: T, h: 40, vx: ENEMY_SPEED * 0.5, type: 'flyratter', alive: true, frame: 0, shell: false, shellVx: 0, baseY: r * T - 8, flyAmp: 40 + Math.random() * 20 }); }
                else if (ch === 'C') { grid[r][c] = 0; coins.push({ x: c * T + 8, y: r * T + 4, w: 16, h: 24, collected: false, anim: Math.random() * Math.PI * 2 }); }
                else if (ch === 'L') { grid[r][c] = 0; oneUps.push({ x: c * T + 4, y: r * T + 4, w: 24, h: 24, collected: false, bob: Math.random() * Math.PI * 2 }); }
                else if (ch === 'W') { grid[r][c] = 0; fireFlowers.push({ x: c * T + 4, y: r * T + 2, w: 24, h: 28, collected: false, anim: Math.random() * Math.PI * 2 }); }
                else if (ch === 'H') { grid[r][c] = 0; checkpoints.push({ x: c * T, y: r * T, col: c, row: r, active: false }); }
                else if (ch === 'K') grid[r][c] = 11;
                else if (ch === 'D') grid[r][c] = 12;
                else if (ch === 'Z') grid[r][c] = 13; // rare question block
                else if (ch === 'X') { grid[r][c] = 0; } // boss spawn marker handled separately
                else if (ch === 'S') { grid[r][c] = 0; spawnX = c; spawnY = r; }
                else grid[r][c] = 0;
            }
        }
        return { grid, rows, cols, enemies, coins, oneUps, fireFlowers, checkpoints, spawnX, spawnY, flagX, flagY };
    }

    // GAME STATE
    let state = 'start', currentLevel = 0, score = 0, lives = 3, coinCount = 0, frameCount = 0;
    let level = null, cam = { x: 0 }, shakeTimer = 0, shakeAmt = 0;
    let invincibleTimer = 0, deathTimer = 0, winTimer = 0;
    let questionHits = [];// tracks which question blocks have been hit
    let hasFire = false, fireCooldown = 0;
    let activeCheckpoint = null; // { x, y } of the last activated checkpoint
    let fireballs = [];
    let arrows = []; // enemy archer arrows
    let speedBoost = 0; // extra walk speed from shop
    let shieldHits = 0; // shield hits remaining
    let shopSelection = 0; // currently highlighted shop item
    let hasGlide = false, isGliding = false; // glide power-up
    let starPowerTimer = 0; // super star invincibility timer (frames)
    let isBig = false; // big mushroom power-up (2 blocks tall, break bricks)
    let stars = []; // spawned star items in the level
    let powerUps = []; // spawned power-up items from question blocks
    let heldShell = null; // reference to shell enemy being carried
    let inventory = []; // stored power-ups (hotbar), max 5 slots
    const MAX_INVENTORY = 5;
    let hotbarFlash = -1; // slot index that was just used (for flash effect)
    let hotbarFlashTimer = 0;

    // ONLINE MULTIPLAYER STATE
    let onlineMode = false;   // true when playing online
    let isOnlineHost = false;  // true if this player is the host
    let isOnlineGuest = false; // true if this player is the guest
    let netSendTimer = 0;      // throttle sending
    const NET_SEND_INTERVAL = 2; // send every N frames
    let guestState = null;     // received game state for guest rendering
    let remoteInputs = { left: false, right: false, jump: false, jumpPressed: false, glide: false, scratch: false, fireball: false, throwShell: false };
    let guestScratchFlag = false; // set when guest presses scratch, sent to host
    let guestFireballFlag = false; // set when guest presses fireball, sent to host
    let netDisconnectMsg = '';
    let netDisconnectTimer = 0;

    // CAT SKINS
    let selectedSkin = 0, closetSelection = 0;
    let unlockedSkins = [true, false, false, false, false, false, false, false];
    const CAT_SKINS = [
        { name: 'Orange Tabby', cost: 0, body: '#F5A623', highlight: '#F7BF56', legs: '#E8941E', ear: '#FF8FAB', nose: '#FF6B8A', paw: '#FFF' },
        { name: 'Tuxedo', cost: 10, body: '#222222', highlight: '#333333', legs: '#1a1a1a', ear: '#FF8FAB', nose: '#FF6B8A', paw: '#FFFFFF' },
        { name: 'Calico', cost: 15, body: '#E8A050', highlight: '#F0C080', legs: '#CC8833', ear: '#FFB6C1', nose: '#FF6B8A', paw: '#FFF' },
        { name: 'Shadow', cost: 25, body: '#2a2a3e', highlight: '#3a3a50', legs: '#1a1a2e', ear: '#8866AA', nose: '#AA88CC', paw: '#4a4a5e' },
        { name: 'Snow', cost: 20, body: '#E8E8F0', highlight: '#F5F5FF', legs: '#D0D0DA', ear: '#FFB0C0', nose: '#FF8899', paw: '#FFF' },
        { name: 'Ginger', cost: 15, body: '#CC5500', highlight: '#DD7722', legs: '#AA4400', ear: '#FF8FAB', nose: '#FF4466', paw: '#FFE0CC' },
        { name: 'Siamese', cost: 30, body: '#E8DCC8', highlight: '#F0E8D8', legs: '#8B7355', ear: '#8B7355', nose: '#A08060', paw: '#DDD0C0' },
        { name: 'Galaxy', cost: 50, body: '#2B1055', highlight: '#4A2080', legs: '#1A0A40', ear: '#FF66AA', nose: '#FF88CC', paw: '#7B68EE' },
    ];

    const SHOP_ITEMS = [
        { name: 'Extra Life', icon: '❤️', desc: '+1 Life', cost: 5, action: () => { lives++; } },
        { name: 'Fire Power', icon: '🔥', desc: 'Fireball ability', cost: 8, action: () => { hasFire = true; } },
        { name: 'Speed Boost', icon: '⚡', desc: 'Faster movement', cost: 10, action: () => { speedBoost = Math.min(speedBoost + 1, WALK); } },
        { name: 'Glide', icon: '🪂', desc: 'Hold Q to glide', cost: 12, skyOnly: true, action: () => { hasGlide = true; } },
        { name: 'Shield', icon: '🛡️', desc: 'Absorb 3 hits', cost: 15, action: () => { shieldHits = 3; } },
        { name: 'Big Mushroom', icon: '🍄', desc: 'Grow big, break bricks', cost: 12, action: () => { isBig = true; cat.y -= 32; cat.h = 64; } },
        { name: 'Cat Revive', icon: '💖', desc: 'Revive partner +3HP', cost: 10, coopOnly: true, action: () => { p1HP = 3; p2HP = 3; cat.dead = false; cat2.dead = false; } },
    ];
    function getVisibleShopItems() {
        const isSky = currentLevel >= 5 && currentLevel <= 10;
        return SHOP_ITEMS.filter(item => (!item.skyOnly || isSky) && (!item.coopOnly || coopMode));
    }

    // BOSS
    let boss = null;
    const BOSS_MAX_HP = 10;
    const PIRATE_BOSS_HP = 12;
    function createBoss(x, y, isPirate) {
        return {
            x: x, y: y, w: 64, h: 64,
            vx: 0, vy: 0,
            hp: isPirate ? PIRATE_BOSS_HP : BOSS_MAX_HP,
            maxHp: isPirate ? PIRATE_BOSS_HP : BOSS_MAX_HP,
            alive: true,
            pirate: isPirate || false,
            phase: 'idle',
            phaseTimer: 60,
            dir: -1,
            frame: 0,
            flashTimer: 0,
            attackCount: 0,
            grounded: false,
            deathTimer: 0,
        };
    }

    const cat = { x: 0, y: 0, w: 24, h: 32, vx: 0, vy: 0, dir: 1, grounded: false, jumping: false, dead: false, canDoubleJump: true };
    const keys = { left: false, right: false, jump: false, jumpPressed: false, glide: false };
    let scratchTimer = 0, scratchCooldown = 0; // scratch attack state

    // CO-OP
    let coopMode = false;
    const cat2 = { x: 0, y: 0, w: 24, h: 32, vx: 0, vy: 0, dir: 1, grounded: false, jumping: false, dead: false, canDoubleJump: true };
    const keys2 = { left: false, right: false, jump: false, jumpPressed: false, glide: false };
    let cat2DeathTimer = 0;
    let isBig2 = false;
    let heldShell2 = null;
    let cat2ScratchTimer = 0, cat2ScratchCooldown = 0;
    let cat2SelectedSkin = 1; // Tuxedo by default
    let p1HP = 3, p2HP = 3; // Individual HP for co-op
    let invincibleTimer2 = 0; // P2 invincibility (separate from P1)

    // PARTICLES
    let particles = [];
    let voidParticles = [];
    function addParticle(x, y, color, count, spread) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x, y, vx: (Math.random() - .5) * spread, vy: -Math.random() * spread * 0.7 - 1,
                life: 20 + Math.random() * 20, maxLife: 40, size: 2 + Math.random() * 3, color
            });
        }
    }

    // INPUT
    function setKey(code, val) {
        if (code === 'KeyA') keys.left = val;
        if (code === 'KeyD') keys.right = val;
        if (code === 'Space' || code === 'KeyW') {
            if (val && !keys.jump) keys.jumpPressed = true;
            keys.jump = val;
        }
        if (code === 'KeyQ') keys.glide = val;
    }
    function setKey2(code, val) {
        if (code === 'ArrowLeft') keys2.left = val;
        if (code === 'ArrowRight') keys2.right = val;
        if (code === 'ArrowUp') {
            if (val && !keys2.jump) keys2.jumpPressed = true;
            keys2.jump = val;
        }
        if (code === 'ArrowDown') keys2.glide = val;
    }
    document.addEventListener('keydown', e => {
        // Allow typing in lobby input
        if (document.activeElement && document.activeElement.id === 'join-code-input') return;
        if (['Space', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW'].includes(e.code)) e.preventDefault();
        if (state === 'start' || state === 'over' || state === 'win') {
            if (e.code === 'Space' || e.code === 'Digit1') { coopMode = false; startGame(); return; }
            if (e.code === 'Digit2') { coopMode = true; startGame(); return; }
            if (e.code === 'Digit3') { openLobby(); return; }
        }
        if (state === 'levelcomplete' && e.code === 'Space') { openShop(); return; }
        if (state === 'shop') {
            const vis = getVisibleShopItems();
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') { shopSelection = (shopSelection - 1 + vis.length) % vis.length; return; }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') { shopSelection = (shopSelection + 1) % vis.length; return; }
            if (e.code === 'Space' || e.code === 'Enter') { tryBuyItem(shopSelection); return; }
            if (e.code === 'KeyR') { nextLevel(); return; }
            if (e.code === 'Digit1') { tryBuyItem(0); return; }
            if (e.code === 'Digit2') { tryBuyItem(1); return; }
            if (e.code === 'Digit3') { tryBuyItem(2); return; }
            if (e.code === 'Digit4') { tryBuyItem(3); return; }
            if (e.code === 'Digit5') { tryBuyItem(4); return; }
            return;
        }
        if (state === 'playing' && e.code === 'KeyN') { currentLevel++; if (currentLevel >= LEVEL_DATA.length) { currentLevel = 0; } loadLevel(currentLevel); return; }
        // P+2 toggles co-op on/off
        if (state === 'playing' && e.code === 'Digit2' && keys2._pHeld) {
            coopMode = !coopMode;
            if (coopMode) {
                cat2.x = cat.x + 30; cat2.y = cat.y; cat2.vx = 0; cat2.vy = 0;
                cat2.dead = false; cat2.grounded = false; isBig2 = false; cat2.h = 32; heldShell2 = null;
                cat2SelectedSkin = selectedSkin === 1 ? 0 : 1;
                addParticle(cat2.x + cat2.w / 2, cat2.y + cat2.h / 2, '#88CCFF', 15, 6);
            } else {
                cat2.dead = true; heldShell2 = null;
                addParticle(cat2.x + cat2.w / 2, cat2.y + cat2.h / 2, '#FF8888', 10, 5);
            }
            return;
        }
        if (e.code === 'KeyP') keys2._pHeld = true;
        if (state === 'playing' && e.code === 'KeyE' && hasFire && fireCooldown <= 0) {
            if (isOnlineGuest) { guestFireballFlag = true; } else { shootFireball(); }
        }
        if (state === 'playing' && (e.code === 'KeyF' || e.code === 'KeyX') && scratchCooldown <= 0 && !cat.dead) {
            if (isOnlineGuest) { guestScratchFlag = true; }
            else if (heldShell) {
                // Throw held shell
                heldShell.shellVx = cat.dir * 4;
                heldShell.vx = heldShell.shellVx;
                heldShell.vy = -3;
                heldShell.x = cat.x + (cat.dir === 1 ? cat.w + 4 : -heldShell.w - 4);
                heldShell.y = cat.y;
                heldShell = null;
                invincibleTimer = 15;
                shakeTimer = 4; shakeAmt = 3;
                addParticle(cat.x + cat.w / 2, cat.y, '#44AA44', 8, 5);
            } else {
                startScratch();
            }
        }
        if (state === 'playing' && e.code === 'KeyT') { state = 'closet'; closetSelection = selectedSkin; return; }
        // P2 fireball
        if (state === 'playing' && coopMode && e.code === 'KeyP' && hasFire && fireCooldown <= 0 && !cat2.dead) { shootFireball2(); }
        // P2 scratch/throw
        if (state === 'playing' && coopMode && e.code === 'KeyO' && cat2ScratchCooldown <= 0 && !cat2.dead) {
            if (heldShell2) {
                heldShell2.shellVx = cat2.dir * 4;
                heldShell2.vx = heldShell2.shellVx;
                heldShell2.vy = -3;
                heldShell2.x = cat2.x + (cat2.dir === 1 ? cat2.w + 4 : -heldShell2.w - 4);
                heldShell2.y = cat2.y;
                heldShell2 = null;
                invincibleTimer = 15;
                shakeTimer = 4; shakeAmt = 3;
                addParticle(cat2.x + cat2.w / 2, cat2.y, '#44AA44', 8, 5);
            } else {
                startScratch2();
            }
        }
        // Hotbar: number keys 1-5 to use stored power-ups (P1 or P2)
        if (state === 'playing' && (!cat.dead || (coopMode && !cat2.dead))) {
            const slotKeys = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'];
            const slotIdx = slotKeys.indexOf(e.code);
            if (slotIdx >= 0 && slotIdx < inventory.length) {
                const item = inventory[slotIdx];
                item.apply();
                hotbarFlash = slotIdx; hotbarFlashTimer = 15;
                // Center particles on whichever cat is alive
                const activeCat = !cat.dead ? cat : cat2;
                addParticle(activeCat.x + activeCat.w / 2, activeCat.y, item.color, 10, 5);
                inventory.splice(slotIdx, 1);
            }
        }
        if (state === 'closet') {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') { closetSelection = (closetSelection - 1 + CAT_SKINS.length) % CAT_SKINS.length; return; }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') { closetSelection = (closetSelection + 1) % CAT_SKINS.length; return; }
            if (e.code === 'Space' || e.code === 'Enter') {
                if (unlockedSkins[closetSelection]) {
                    selectedSkin = closetSelection; state = 'playing';
                } else if (coinCount >= CAT_SKINS[closetSelection].cost) {
                    coinCount -= CAT_SKINS[closetSelection].cost;
                    unlockedSkins[closetSelection] = true;
                    selectedSkin = closetSelection; state = 'playing';
                }
                return;
            }
            if (e.code === 'Escape' || e.code === 'KeyT') { state = 'playing'; return; }
            return;
        }
        setKey(e.code, true);
        if (coopMode && !onlineMode) setKey2(e.code, true);
    });
    document.addEventListener('keyup', e => { setKey(e.code, false); if (coopMode && !onlineMode) setKey2(e.code, false); if (e.code === 'KeyP') keys2._pHeld = false; });
    canvas.addEventListener('click', (e) => {
        if (state === 'start' || state === 'over' || state === 'win') startGame();
        else if (state === 'levelcomplete') openShop();
        else if (state === 'shop') {
            // Check if clicked on an item or the continue button
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left, my = e.clientY - rect.top;
            const shopY = 140;
            const itemW = 140, itemH = 120, gap = 20;
            const totalW = SHOP_ITEMS.length * itemW + (SHOP_ITEMS.length - 1) * gap;
            const startX = (W - totalW) / 2;
            for (let i = 0; i < SHOP_ITEMS.length; i++) {
                const ix = startX + i * (itemW + gap);
                if (mx >= ix && mx <= ix + itemW && my >= shopY && my <= shopY + itemH) {
                    tryBuyItem(i); return;
                }
            }
            // Continue button area
            if (my >= 320 && my <= 360) { nextLevel(); }
        }
    });

    // Mobile
    const btnL = document.getElementById('btn-left'), btnR = document.getElementById('btn-right'), btnJ = document.getElementById('btn-jump');
    if (btnL) {
        btnL.addEventListener('touchstart', e => { e.preventDefault(); keys.left = true; }, { passive: false });
        btnL.addEventListener('touchend', () => { keys.left = false; });
        btnR.addEventListener('touchstart', e => { e.preventDefault(); keys.right = true; }, { passive: false });
        btnR.addEventListener('touchend', () => { keys.right = false; });
        btnJ.addEventListener('touchstart', e => { e.preventDefault(); keys.jump = true; keys.jumpPressed = true; }, { passive: false });
        btnJ.addEventListener('touchend', () => { keys.jump = false; });
    }

    // TILE COLLISION
    function solid(r, c) {
        if (!level || r < 0 || r >= level.rows || c < 0 || c >= level.cols) return false;
        const t = level.grid[r][c];
        return t === 1 || t === 2 || t === 3 || t === 8 || t === 9 || t === 10 || t === 11 || t === 13;
    }

    function tileAt(px, py) { return { r: Math.floor(py / T), c: Math.floor(px / T) }; }

    // CAT PHYSICS & COLLISION
    function updateCat() {
        // Camera & invincibility always update (even when dead)
        if (level) {
            let targetCam;
            if (coopMode && !cat.dead && !cat2.dead) {
                targetCam = ((cat.x + cat2.x) / 2) - W / 3;
            } else if (coopMode && cat.dead && !cat2.dead) {
                targetCam = cat2.x - W / 3;
            } else if (coopMode && !cat.dead && cat2.dead) {
                targetCam = cat.x - W / 3;
            } else {
                targetCam = cat.x - W / 3;
            }
            targetCam = Math.max(0, Math.min(targetCam, level.cols * T - W));
            cam.x += (targetCam - cam.x) * 0.1;
        }
        if (invincibleTimer > 0) invincibleTimer--;

        if (cat.dead) {
            deathTimer--;
            if (deathTimer <= 0) {
                if (coopMode && p1HP <= 0) return; // permanently dead
                respawn();
            }
            return;
        }
        // Horizontal
        cat.vx = 0;
        if (keys.left) { cat.vx = -(WALK + speedBoost); cat.dir = -1; }
        if (keys.right) { cat.vx = WALK + speedBoost; cat.dir = 1; }
        // Jump
        if (keys.jumpPressed && cat.grounded) {
            cat.vy = JUMP; cat.grounded = false; cat.jumping = true; cat.canDoubleJump = true;
        } else if (keys.jumpPressed && !cat.grounded && cat.canDoubleJump) {
            cat.vy = JUMP * 0.75; cat.canDoubleJump = false;
            // Puff particles for double jump
            for (let i = 0; i < 6; i++) {
                addParticle(cat.x + cat.w / 2, cat.y + cat.h, '#FFFFFF', 2, 3);
            }
        }
        keys.jumpPressed = false;
        // Variable jump height
        if (!keys.jump && cat.vy < -3) cat.vy = -3;
        // Gravity + Glide
        isGliding = hasGlide && keys.glide && !cat.grounded && cat.vy > 0;
        if (isGliding) {
            cat.vy = Math.min(cat.vy + GRAVITY * 0.15, 1.5);
            // Wind particles while gliding
            if (frameCount % 3 === 0) addParticle(cat.x + cat.w / 2, cat.y + cat.h + 4, '#B0D8FF', 1.5, 4);
        } else {
            cat.vy = Math.min(cat.vy + GRAVITY, MAX_FALL);
        }

        // Move X
        cat.x += cat.vx;
        // Collide X
        const m = 4;// margin
        if (cat.vx > 0) {
            let tc = Math.floor((cat.x + cat.w - m) / T);
            let tr1 = Math.floor((cat.y + 2) / T), tr2 = Math.floor((cat.y + cat.h - 2) / T);
            for (let r = tr1; r <= tr2; r++) { if (solid(r, tc)) { cat.x = tc * T - cat.w + m; cat.vx = 0; break; } }
        } else if (cat.vx < 0) {
            let tc = Math.floor((cat.x + m) / T);
            let tr1 = Math.floor((cat.y + 2) / T), tr2 = Math.floor((cat.y + cat.h - 2) / T);
            for (let r = tr1; r <= tr2; r++) { if (solid(r, tc)) { cat.x = (tc + 1) * T - m; cat.vx = 0; break; } }
        }

        // Move Y
        cat.y += cat.vy;
        cat.grounded = false;
        if (cat.vy > 0) {
            // Falling — check below
            let tr = Math.floor((cat.y + cat.h) / T);
            let tc1 = Math.floor((cat.x + m) / T), tc2 = Math.floor((cat.x + cat.w - m - 1) / T);
            for (let c = tc1; c <= tc2; c++) {
                if (solid(tr, c)) { cat.y = tr * T - cat.h; cat.vy = 0; cat.grounded = true; cat.jumping = false; break; }
            }
        } else if (cat.vy < 0) {
            // Rising — check above (head bump, question blocks)
            let tr = Math.floor(cat.y / T);
            let tc1 = Math.floor((cat.x + m) / T), tc2 = Math.floor((cat.x + cat.w - m - 1) / T);
            for (let c = tc1; c <= tc2; c++) {
                if (solid(tr, c)) {
                    cat.y = (tr + 1) * T; cat.vy = 1;
                    // Hit question block or rare question block?
                    if (level.grid[tr][c] === 3 || level.grid[tr][c] === 13) { hitQuestion(tr, c); }
                    // Break bricks when big
                    else if (isBig && level.grid[tr][c] === 2) {
                        level.grid[tr][c] = 0;
                        shakeTimer = 4; shakeAmt = 3;
                        addParticle(c * T + T / 2, tr * T + T / 2, '#8B4513', 12, 6);
                        addParticle(c * T + T / 2, tr * T + T / 2, '#A0522D', 8, 4);
                        score += 50;
                    }
                    break;
                }
            }
        }

        // Fall off map
        if (cat.y > level.rows * T + 100) killCat();

        // Keep in bounds left
        if (cat.x < 0) cat.x = 0;

        // Dust particles
        if (cat.grounded && (keys.left || keys.right) && frameCount % 4 === 0) {
            addParticle(cat.x + cat.w / 2, cat.y + cat.h, '#b89070', 2, 2);
        }

        // Update held shell position
        if (heldShell) {
            heldShell.x = cat.x + cat.w / 2 - heldShell.w / 2;
            heldShell.y = cat.y - heldShell.h + 4;
            heldShell.vx = 0; heldShell.vy = 0; heldShell.shellVx = 0;
        }
    }

    function hitQuestion(r, c) {
        const isRare = level.grid[r][c] === 13;
        // Star chance: 50% for rare blocks, 1% for normal
        if (Math.random() < (isRare ? 0.5 : 0.01)) {
            stars.push({ x: c * T, y: r * T - T, vx: 2, vy: -4, w: 24, h: 24, anim: 0 });
            addParticle(c * T + T / 2, r * T - 20, '#FFD700', 20, 8);
            addParticle(c * T + T / 2, r * T - 16, '#FFFFFF', 15, 6);
        }
        level.grid[r][c] = 8;
        questionHits.push({ r, c, timer: 8 });
        // Random 1-5 coins
        const numCoins = Math.floor(Math.random() * 5) + 1;
        coinCount += numCoins;
        score += numCoins * 100;
        for (let i = 0; i < numCoins; i++) {
            addParticle(c * T + T / 2 + (Math.random() - 0.5) * 16, r * T - 8 - i * 6, '#FFD700', 6, 4);
        }
        // 15% chance to spawn a rat enemy
        if (Math.random() < 0.15) {
            level.enemies.push({ x: c * T, y: r * T - T, w: T, h: T, vx: (Math.random() > 0.5 ? 1 : -1) * ENEMY_SPEED, vy: -4, type: 'rat', alive: true, frame: 0 });
            addParticle(c * T + T / 2, r * T - 10, '#8B4513', 8, 4);
        }
        // 50% chance to spawn a power-up item
        else if (Math.random() < 0.5) {
            const roll = Math.random();
            let puType, puColor, puIcon, puApply;
            if (roll < 0.3) {
                puType = 'life'; puColor = '#FF69B4'; puIcon = '❤'; puApply = () => { lives++; };
            } else if (roll < 0.55) {
                puType = 'fire'; puColor = '#FF4500'; puIcon = '🔥'; puApply = () => { hasFire = true; };
            } else if (roll < 0.8) {
                puType = 'speed'; puColor = '#00FFFF'; puIcon = '⚡'; puApply = () => { speedBoost = Math.min(speedBoost + 0.5, WALK); };
            } else if (roll < 0.9) {
                puType = 'big'; puColor = '#FF2222'; puIcon = '🍄'; puApply = () => { isBig = true; cat.y -= 32; cat.h = 64; };
            } else {
                puType = 'shield'; puColor = '#4488FF'; puIcon = '🛡️'; puApply = () => { shieldHits = Math.min(shieldHits + 1, 5); };
            }
            powerUps.push({
                x: c * T + 4, y: r * T - T, w: 24, h: 24,
                vx: (Math.random() > 0.5 ? 1 : -1) * 1.5, vy: -5,
                type: puType, color: puColor, icon: puIcon,
                apply: puApply, anim: 0
            });
        }
    }

    function killCat() {
        if (invincibleTimer > 0) return;
        if (isBig) {
            isBig = false;
            cat.h = 32;
            invincibleTimer = 90;
            shakeTimer = 6; shakeAmt = 4;
            addParticle(cat.x + cat.w / 2, cat.y + cat.h / 2, '#FF4444', 10, 6);
            addParticle(cat.x + cat.w / 2, cat.y + cat.h / 2, '#FFF', 6, 4);
            return;
        }
        if (shieldHits > 0) {
            shieldHits--;
            invincibleTimer = 60;
            addParticle(cat.x + cat.w / 2, cat.y + cat.h / 2, '#44AAFF', 8, 5);
            addParticle(cat.x + cat.w / 2, cat.y + cat.h / 2, '#AADDFF', 6, 4);
            return;
        }
        cat.dead = true; cat.vy = -8; deathTimer = 60; heldShell = null;
        if (coopMode) {
            p1HP--;
            if (p1HP <= 0 && p2HP <= 0) { deathTimer = 90; state = 'over'; }
        } else {
            lives--;
            if (lives < 0) { deathTimer = 90; state = 'over'; }
        }
    }

    function respawn() {
        cat.dead = false;
        isBig = false; cat.h = 32;
        if (activeCheckpoint) {
            cat.x = activeCheckpoint.x; cat.y = activeCheckpoint.y - cat.h;
        } else {
            cat.x = level.spawnX * T; cat.y = level.spawnY * T - cat.h;
        }
        cat.vx = 0; cat.vy = 0; cat.grounded = false;
        invincibleTimer = 90; cam.x = Math.max(0, cat.x - W / 3);
    }

    // CO-OP P2 FUNCTIONS
    function updateCat2() {
        if (!coopMode) return;
        if (cat2.dead) {
            cat2DeathTimer--;
            if (cat2DeathTimer <= 0) {
                if (p2HP <= 0) return; // permanently dead
                respawn2();
            }
            return;
        }
        if (invincibleTimer2 > 0) invincibleTimer2--;
        cat2.vx = 0;
        if (keys2.left) { cat2.vx = -(WALK + speedBoost); cat2.dir = -1; }
        if (keys2.right) { cat2.vx = WALK + speedBoost; cat2.dir = 1; }
        if (keys2.jumpPressed && cat2.grounded) {
            cat2.vy = JUMP; cat2.grounded = false; cat2.jumping = true; cat2.canDoubleJump = true;
        } else if (keys2.jumpPressed && !cat2.grounded && cat2.canDoubleJump) {
            cat2.vy = JUMP * 0.75; cat2.canDoubleJump = false;
            for (let i = 0; i < 6; i++) addParticle(cat2.x + cat2.w / 2, cat2.y + cat2.h, '#FFFFFF', 2, 3);
        }
        keys2.jumpPressed = false;
        if (!keys2.jump && cat2.vy < -3) cat2.vy = -3;
        const isGliding2 = hasGlide && keys2.glide && !cat2.grounded && cat2.vy > 0;
        if (isGliding2) { cat2.vy = Math.min(cat2.vy + GRAVITY * 0.15, 1.5); }
        else { cat2.vy = Math.min(cat2.vy + GRAVITY, MAX_FALL); }
        cat2.x += cat2.vx;
        const m = 4;
        if (cat2.vx > 0) {
            let tc = Math.floor((cat2.x + cat2.w - m) / T);
            let tr1 = Math.floor((cat2.y + 2) / T), tr2 = Math.floor((cat2.y + cat2.h - 2) / T);
            for (let r = tr1; r <= tr2; r++) { if (solid(r, tc)) { cat2.x = tc * T - cat2.w + m; cat2.vx = 0; break; } }
        } else if (cat2.vx < 0) {
            let tc = Math.floor((cat2.x + m) / T);
            let tr1 = Math.floor((cat2.y + 2) / T), tr2 = Math.floor((cat2.y + cat2.h - 2) / T);
            for (let r = tr1; r <= tr2; r++) { if (solid(r, tc)) { cat2.x = (tc + 1) * T - m; cat2.vx = 0; break; } }
        }
        cat2.y += cat2.vy;
        cat2.grounded = false;
        if (cat2.vy > 0) {
            let tr = Math.floor((cat2.y + cat2.h) / T);
            let tc1 = Math.floor((cat2.x + m) / T), tc2 = Math.floor((cat2.x + cat2.w - m - 1) / T);
            for (let c = tc1; c <= tc2; c++) {
                if (solid(tr, c)) { cat2.y = tr * T - cat2.h; cat2.vy = 0; cat2.grounded = true; cat2.jumping = false; break; }
            }
        } else if (cat2.vy < 0) {
            let tr = Math.floor(cat2.y / T);
            let tc1 = Math.floor((cat2.x + m) / T), tc2 = Math.floor((cat2.x + cat2.w - m - 1) / T);
            for (let c = tc1; c <= tc2; c++) {
                if (solid(tr, c)) {
                    cat2.y = (tr + 1) * T; cat2.vy = 1;
                    if (level.grid[tr][c] === 3 || level.grid[tr][c] === 13) { hitQuestion(tr, c); }
                    else if (isBig2 && level.grid[tr][c] === 2) {
                        level.grid[tr][c] = 0; shakeTimer = 4; shakeAmt = 3;
                        addParticle(c * T + T / 2, tr * T + T / 2, '#8B4513', 12, 6);
                        score += 50;
                    }
                    break;
                }
            }
        }
        if (cat2.y > level.rows * T + 100) killCat2();
        if (cat2.x < 0) cat2.x = 0;
        if (heldShell2) {
            heldShell2.x = cat2.x + cat2.w / 2 - heldShell2.w / 2;
            heldShell2.y = cat2.y - heldShell2.h + 4;
            heldShell2.vx = 0; heldShell2.vy = 0; heldShell2.shellVx = 0;
        }
        if (cat2.grounded && (keys2.left || keys2.right) && frameCount % 4 === 0) {
            addParticle(cat2.x + cat2.w / 2, cat2.y + cat2.h, '#b89070', 2, 2);
        }
    }

    function killCat2() {
        if (invincibleTimer2 > 0) return;
        if (isBig2) {
            isBig2 = false; cat2.h = 32; invincibleTimer2 = 90;
            addParticle(cat2.x + cat2.w / 2, cat2.y + cat2.h / 2, '#FF4444', 10, 6);
            return;
        }
        cat2.dead = true; cat2.vy = -8; cat2DeathTimer = 60; heldShell2 = null;
        p2HP--;
        if (p1HP <= 0 && p2HP <= 0) { cat2DeathTimer = 90; state = 'over'; }
    }

    function respawn2() {
        cat2.dead = false; isBig2 = false; cat2.h = 32;
        if (activeCheckpoint) {
            cat2.x = activeCheckpoint.x + 30; cat2.y = activeCheckpoint.y - cat2.h;
        } else {
            cat2.x = level.spawnX * T + 30; cat2.y = level.spawnY * T - cat2.h;
        }
        cat2.vx = 0; cat2.vy = 0; cat2.grounded = false;
    }

    function startScratch2() {
        cat2ScratchTimer = 8; cat2ScratchCooldown = 15;
        shakeTimer = 3; shakeAmt = 2;
        const sx = cat2.x + (cat2.dir === 1 ? cat2.w + 8 : -16);
        const sy = cat2.y + cat2.h / 2;
        for (let i = 0; i < 5; i++) addParticle(sx + (Math.random() - 0.5) * 12, sy + (Math.random() - 0.5) * 20, '#FFF', 1, 3);
        const hx = cat2.dir === 1 ? cat2.x + cat2.w - 4 : cat2.x - 36;
        const hy = cat2.y - 4;
        const hw = 40, hh = cat2.h + 8;
        if (level) {
            level.enemies.forEach(e => {
                if (!e.alive) return;
                if (e === heldShell2) return;
                if (hx < e.x + e.w && hx + hw > e.x && hy < e.y + e.h && hy + hh > e.y) {
                    if (e.type === 'ratter' && e.shell && !heldShell2) {
                        heldShell2 = e; e.vx = 0; e.shellVx = 0;
                        addParticle(e.x + e.w / 2, e.y + e.h / 2, '#44AA44', 6, 4);
                    } else {
                        e.alive = false; score += 200;
                        shakeTimer = 6; shakeAmt = 4;
                        addParticle(e.x + e.w / 2, e.y + e.h / 2, '#FF4444', 10, 6);
                    }
                }
            });
        }
        if (boss && boss.alive) {
            if (hx < boss.x + boss.w && hx + hw > boss.x && hy < boss.y + boss.h && hy + hh > boss.y) {
                damageBoss(1);
            }
        }
    }

    function shootFireball2() {
        fireCooldown = 20;
        const fb = {
            x: cat2.x + (cat2.dir === 1 ? cat2.w : -10), y: cat2.y + cat2.h / 2 - 5,
            w: 10, h: 10, vx: cat2.dir * 7, vy: -2, bounces: 0, life: 120, trail: []
        };
        fireballs.push(fb);
        addParticle(fb.x, fb.y, '#FF4500', 4, 3);
    }

    // CHECKPOINTS
    function updateCheckpoints() {
        if (!level || !level.checkpoints) return;
        level.checkpoints.forEach(cp => {
            if (cp.active) return;
            // Check cat overlap
            if (cat.x + cat.w > cp.x && cat.x < cp.x + T &&
                cat.y + cat.h > cp.y && cat.y < cp.y + T) {
                cp.active = true;
                activeCheckpoint = { x: cp.x, y: cp.y };
                // Deactivate any other checkpoints
                level.checkpoints.forEach(other => { if (other !== cp) other.active = false; });
                // Celebration particles
                for (let i = 0; i < 12; i++) {
                    addParticle(cp.x + T / 2, cp.y, ['#00FF00', '#FFFF00', '#00FFAA', '#FFFFFF'][Math.floor(Math.random() * 4)], 3, 4);
                }
                score += 200;
            }
        });
    }

    function drawCheckpoints() {
        if (!level || !level.checkpoints) return;
        level.checkpoints.forEach(cp => {
            const cx = Math.round(cp.x - cam.x), cy = Math.round(cp.y);
            if (cx < -T || cx > W + T) return;

            // Pole
            ctx.fillStyle = cp.active ? '#00CC00' : '#888';
            ctx.fillRect(cx + 14, cy - 20, 4, T + 20);

            // Base
            ctx.fillStyle = cp.active ? '#008800' : '#666';
            ctx.fillRect(cx + 8, cy + T - 6, 16, 6);

            // Flag
            if (cp.active) {
                const wave = Math.sin(frameCount * 0.1) * 2;
                ctx.fillStyle = '#00FF44';
                ctx.beginPath();
                ctx.moveTo(cx + 18, cy - 18);
                ctx.lineTo(cx + 34 + wave, cy - 12);
                ctx.lineTo(cx + 18, cy - 4);
                ctx.closePath();
                ctx.fill();
                // Star on flag
                ctx.fillStyle = '#FFFF00';
                ctx.font = '10px sans-serif';
                ctx.fillText('★', cx + 20 + wave * 0.5, cy - 8);
            } else {
                ctx.fillStyle = '#AAA';
                ctx.beginPath();
                ctx.moveTo(cx + 18, cy - 18);
                ctx.lineTo(cx + 30, cy - 12);
                ctx.lineTo(cx + 18, cy - 4);
                ctx.closePath();
                ctx.fill();
            }
        });
    }

    // ENEMIES
    function updateEnemies() {
        if (!level) return;
        level.enemies.forEach(e => {
            if (!e.alive) return;
            if (e === heldShell) return; // skip held shell
            if (e === heldShell2) return; // skip P2 held shell
            e.x += e.vx; e.frame += 0.05;

            // Apply gravity to enemies (flyratters fly instead)
            if (e.type === 'flyratter') {
                e.y = e.baseY + Math.sin(e.frame * 2) * e.flyAmp;
                e.vy = 0;
            } else {
                if (!e.vy) e.vy = 0;
                e.vy = Math.min((e.vy || 0) + 0.4, MAX_FALL);
                e.y += e.vy;

                // Land on ground
                let footR = Math.floor((e.y + e.h) / T);
                let ec1 = Math.floor((e.x + 4) / T), ec2 = Math.floor((e.x + e.w - 4) / T);
                for (let c = ec1; c <= ec2; c++) {
                    if (solid(footR, c)) {
                        e.y = footR * T - e.h;
                        e.vy = 0;
                        break;
                    }
                }
            }

            // Remove if fallen off map
            if (e.y > level.rows * T + 100) { e.alive = false; return; }

            // Archer AI: stationary, face cat, shoot arrows
            if (e.type === 'archer') {
                e.vx = 0; // archers don't walk
                // Face nearest cat
                let targetCat = cat;
                if (coopMode && !cat2.dead && !cat.dead) {
                    const d1 = Math.abs(cat.x - e.x), d2 = Math.abs(cat2.x - e.x);
                    targetCat = d2 < d1 ? cat2 : cat;
                } else if (coopMode && cat.dead && !cat2.dead) {
                    targetCat = cat2;
                }
                e.dir = targetCat.x < e.x ? -1 : 1;
                // Shoot when cat in range
                const dist = Math.abs(targetCat.x - e.x);
                if (dist < 280 && !targetCat.dead) {
                    e.shootTimer--;
                    if (e.shootTimer <= 0) {
                        e.shootTimer = e.shootCooldown;
                        // Calculate arrow direction toward cat
                        const dx = (targetCat.x + targetCat.w / 2) - (e.x + e.w / 2);
                        const dy = (targetCat.y + targetCat.h / 2) - (e.y + e.h / 2);
                        const len = Math.sqrt(dx * dx + dy * dy) || 1;
                        const speed = 3.5;
                        arrows.push({
                            x: e.x + e.w / 2 + e.dir * 10,
                            y: e.y + 8,
                            w: 12, h: 4,
                            vx: (dx / len) * speed,
                            vy: (dy / len) * speed,
                            life: 180,
                            trail: []
                        });
                        addParticle(e.x + e.w / 2 + e.dir * 10, e.y + 8, '#8B4513', 3, 2);
                    }
                }
            }

            // Reverse at walls or edges
            let frontC = Math.floor((e.vx > 0 ? e.x + e.w : e.x) / T);
            let fR = Math.floor((e.y + e.h) / T);
            let headR = Math.floor((e.y + e.h / 2) / T);
            const isShell = (e.type === 'ratter' || e.type === 'flyratter') && e.shell;
            const isFlying = e.type === 'flyratter';
            // Shells only bounce off walls, not edges (so they fall with gravity)
            // Flyratters reverse at walls but don't need ground
            if (solid(headR, frontC)) e.vx *= -1;
            else if (!isShell && !isFlying && !solid(fR, frontC)) e.vx *= -1;

            // Cat collision (P1)
            if (!cat.dead) {
                let ox = cat.x + 4, oy = cat.y + 2, ow = cat.w - 8, oh = cat.h - 4;
                if (ox < e.x + e.w && ox + ow > e.x && oy < e.y + e.h && oy + oh > e.y) {
                    // Star power: instant kill
                    if (starPowerTimer > 0) {
                        e.alive = false; score += 500;
                        shakeTimer = 4; shakeAmt = 4;
                        addParticle(e.x + e.w / 2, e.y + e.h / 2, '#FFD700', 15, 6);
                        addParticle(e.x + e.w / 2, e.y + e.h / 2, '#FFF', 10, 4);
                        return;
                    }
                    if (invincibleTimer <= 0) {
                        // Ratter/Flyratter shell behavior
                        if (e.type === 'ratter' || e.type === 'flyratter') {
                            if (e.shell) {
                                // Shell is stationary or moving
                                if (cat.vy > 0 && cat.y + cat.h - 8 < e.y + e.h / 2) {
                                    // Stomp shell: if moving → stop, if stopped → kick
                                    if (e.shellVx !== 0) {
                                        e.shellVx = 0; e.vx = 0;
                                        cat.vy = JUMP * 0.5; score += 100;
                                    } else {
                                        e.shellVx = cat.x < e.x ? 3 : -3;
                                        e.vx = e.shellVx;
                                        cat.vy = JUMP * 0.5; score += 100;
                                    }
                                    shakeTimer = 4; shakeAmt = 2;
                                    addParticle(e.x + e.w / 2, e.y + e.h / 2, '#44AA44', 8, 4);
                                } else if (e.shellVx !== 0) {
                                    // Moving shell hits cat
                                    killCat();
                                } else {
                                    // Pick up stationary shell
                                    heldShell = e;
                                    e.vx = 0; e.shellVx = 0;
                                    invincibleTimer = 10;
                                }
                            } else {
                                // Stomp ratter/flyratter
                                if (cat.vy > 0 && cat.y + cat.h - 8 < e.y + e.h / 2) {
                                    if (e.type === 'flyratter') {
                                        // Lose wings, become grounded ratter
                                        e.type = 'ratter';
                                        e.vy = 0;
                                        cat.vy = JUMP * 0.6; score += 200;
                                        shakeTimer = 6; shakeAmt = 3;
                                        addParticle(e.x + e.w / 2, e.y, '#FFF', 8, 6);
                                        addParticle(e.x - 8, e.y, '#FFF', 4, 3);
                                        addParticle(e.x + e.w + 8, e.y, '#FFF', 4, 3);
                                    } else {
                                        e.shell = true; e.vx = 0; e.shellVx = 0;
                                        e.h = T; e.y = e.y + 8;
                                        cat.vy = JUMP * 0.6; score += 200;
                                        shakeTimer = 6; shakeAmt = 3;
                                        addParticle(e.x + e.w / 2, e.y + e.h / 2, '#44AA44', 12, 5);
                                    }
                                } else {
                                    killCat();
                                }
                            }
                            return;
                        }
                        // Stomp regular rat/archer
                        if (cat.vy > 0 && cat.y + cat.h - 8 < e.y + e.h / 2) {
                            e.alive = false; cat.vy = JUMP * 0.6; score += 200;
                            shakeTimer = 6; shakeAmt = 3;
                            addParticle(e.x + e.w / 2, e.y + e.h / 2, '#ff4444', 12, 5);
                        } else {
                            killCat();
                        }
                    } // end invincibleTimer check
                }
            } // end !cat.dead

            // P2 Cat collision (co-op)
            if (coopMode && !cat2.dead) {
                let ox2 = cat2.x + 4, oy2 = cat2.y + 2, ow2 = cat2.w - 8, oh2 = cat2.h - 4;
                if (ox2 < e.x + e.w && ox2 + ow2 > e.x && oy2 < e.y + e.h && oy2 + oh2 > e.y) {
                    if (starPowerTimer > 0) {
                        e.alive = false; score += 500;
                        addParticle(e.x + e.w / 2, e.y + e.h / 2, '#FFD700', 15, 6);
                        return;
                    }
                    if (invincibleTimer2 > 0) return;
                    if ((e.type === 'ratter' || e.type === 'flyratter') && e.shell) {
                        if (cat2.vy > 0 && cat2.y + cat2.h - 8 < e.y + e.h / 2) {
                            if (e.shellVx !== 0) { e.shellVx = 0; e.vx = 0; cat2.vy = JUMP * 0.5; score += 100; }
                            else { e.shellVx = cat2.x < e.x ? 3 : -3; e.vx = e.shellVx; cat2.vy = JUMP * 0.5; score += 100; }
                        } else if (e.shellVx !== 0) { killCat2(); }
                        else { heldShell2 = e; e.vx = 0; e.shellVx = 0; invincibleTimer2 = 10; }
                    } else if ((e.type === 'ratter' || e.type === 'flyratter') && !e.shell) {
                        if (cat2.vy > 0 && cat2.y + cat2.h - 8 < e.y + e.h / 2) {
                            if (e.type === 'flyratter') { e.type = 'ratter'; e.vy = 0; cat2.vy = JUMP * 0.6; score += 200; addParticle(e.x + e.w / 2, e.y, '#FFF', 8, 6); }
                            else { e.shell = true; e.vx = 0; e.shellVx = 0; e.h = T; e.y = e.y + 8; cat2.vy = JUMP * 0.6; score += 200; addParticle(e.x + e.w / 2, e.y + e.h / 2, '#44AA44', 12, 5); }
                        } else { killCat2(); }
                    } else {
                        if (cat2.vy > 0 && cat2.y + cat2.h - 8 < e.y + e.h / 2) {
                            e.alive = false; cat2.vy = JUMP * 0.6; score += 200;
                            addParticle(e.x + e.w / 2, e.y + e.h / 2, '#ff4444', 12, 5);
                        } else { killCat2(); }
                    }
                }
            }

            // Shell kills other enemies
            if (e.type === 'ratter' && e.shell && e.shellVx !== 0) {
                level.enemies.forEach(other => {
                    if (other === e || !other.alive) return;
                    if (e.x < other.x + other.w && e.x + e.w > other.x && e.y < other.y + other.h && e.y + e.h > other.y) {
                        other.alive = false; score += 200;
                        addParticle(other.x + other.w / 2, other.y + other.h / 2, '#ff4444', 12, 5);
                        shakeTimer = 4; shakeAmt = 3;
                    }
                });
            }
        });
    }

    // SUPER STAR
    function updateStars() {
        for (let i = stars.length - 1; i >= 0; i--) {
            const s = stars[i];
            s.anim += 0.1;
            s.x += s.vx;
            s.vy += 0.3;
            s.y += s.vy;
            // Bounce on ground
            let footR = Math.floor((s.y + s.h) / T);
            let sc1 = Math.floor((s.x + 4) / T), sc2 = Math.floor((s.x + s.w - 4) / T);
            for (let c = sc1; c <= sc2; c++) {
                if (solid(footR, c)) { s.y = footR * T - s.h; s.vy = -6; break; }
            }
            // Bounce off walls
            let wallC = Math.floor((s.vx > 0 ? s.x + s.w : s.x) / T);
            let wallR = Math.floor((s.y + s.h / 2) / T);
            if (solid(wallR, wallC)) s.vx *= -1;
            // Remove if off-screen
            if (s.y > level.rows * T + 200) { stars.splice(i, 1); continue; }
            // Sparkle trail
            if (frameCount % 3 === 0) addParticle(s.x + s.w / 2, s.y + s.h / 2, '#FFD700', 2, 3);
            // Cat collection
            if (cat.x + cat.w > s.x && cat.x < s.x + s.w && cat.y + cat.h > s.y && cat.y < s.y + s.h) {
                starPowerTimer = 1800;
                stars.splice(i, 1);
                shakeTimer = 10; shakeAmt = 5;
                for (let p = 0; p < 30; p++) addParticle(cat.x + cat.w / 2, cat.y + cat.h / 2, '#FFD700', 4, 10);
                score += 1000;
            } else if (coopMode && !cat2.dead && cat2.x + cat2.w > s.x && cat2.x < s.x + s.w && cat2.y + cat2.h > s.y && cat2.y < s.y + s.h) {
                starPowerTimer = 1800;
                stars.splice(i, 1);
                shakeTimer = 10; shakeAmt = 5;
                for (let p = 0; p < 30; p++) addParticle(cat2.x + cat2.w / 2, cat2.y + cat2.h / 2, '#FFD700', 4, 10);
                score += 1000;
            }
        }
    }
    function drawStar(s) {
        const sx = s.x - cam.x, sy = s.y;
        if (sx < -T || sx > W + T) return;
        const pulse = Math.sin(s.anim * 3) * 0.2 + 1;
        const spin = s.anim * 2;
        ctx.save();
        ctx.translate(sx + s.w / 2, sy + s.h / 2);
        ctx.rotate(spin);
        ctx.scale(pulse, pulse);
        // Glow
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        // Star shape (5 points)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const a = (i * Math.PI / 5) - Math.PI / 2;
            const r = i % 2 === 0 ? 10 : 4;
            if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath(); ctx.fill();
        // White center
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    // POWER-UP ITEMS
    function updatePowerUps() {
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const p = powerUps[i];
            p.anim += 0.05;
            p.vy += 0.35;
            p.x += p.vx;
            p.y += p.vy;
            // Bounce on ground
            let footR = Math.floor((p.y + p.h) / T);
            let pc1 = Math.floor((p.x + 2) / T), pc2 = Math.floor((p.x + p.w - 2) / T);
            for (let c = pc1; c <= pc2; c++) {
                if (solid(footR, c)) { p.y = footR * T - p.h; p.vy = -3; break; }
            }
            // Bounce off walls
            let wallC = Math.floor((p.vx > 0 ? p.x + p.w : p.x) / T);
            let wallR = Math.floor((p.y + p.h / 2) / T);
            if (solid(wallR, wallC)) p.vx *= -1;
            // Friction to slow down
            p.vx *= 0.995;
            // Remove if off-screen
            if (p.y > level.rows * T + 200) { powerUps.splice(i, 1); continue; }
            // Cat collection — store in inventory
            if (!cat.dead && cat.x + cat.w > p.x && cat.x < p.x + p.w && cat.y + cat.h > p.y && cat.y < p.y + p.h) {
                if (inventory.length < MAX_INVENTORY) {
                    inventory.push({ type: p.type, color: p.color, icon: p.icon, apply: p.apply });
                    hotbarFlash = inventory.length - 1; hotbarFlashTimer = 20;
                } else { p.apply(); }
                addParticle(p.x + p.w / 2, p.y + p.h / 2, p.color, 12, 6);
                addParticle(p.x + p.w / 2, p.y + p.h / 2, '#FFF', 8, 4);
                powerUps.splice(i, 1);
            } else if (coopMode && !cat2.dead && cat2.x + cat2.w > p.x && cat2.x < p.x + p.w && cat2.y + cat2.h > p.y && cat2.y < p.y + p.h) {
                if (inventory.length < MAX_INVENTORY) {
                    inventory.push({ type: p.type, color: p.color, icon: p.icon, apply: p.apply });
                    hotbarFlash = inventory.length - 1; hotbarFlashTimer = 20;
                } else { p.apply(); }
                addParticle(p.x + p.w / 2, p.y + p.h / 2, p.color, 12, 6);
                powerUps.splice(i, 1);
            }
        }
    }
    function drawPowerUp(p) {
        const px = p.x - cam.x, py = p.y;
        if (px < -T || px > W + T) return;
        const bob = Math.sin(p.anim * 3) * 2;
        const cx = px + p.w / 2, cy = py + p.h / 2 + bob;
        // Glow
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;

        if (p.type === 'life') {
            // Green mushroom (same as 1-UP)
            const sx = px, sy = py + bob;
            ctx.fillStyle = '#22CC66';
            ctx.beginPath(); ctx.ellipse(sx + p.w / 2, sy + 8, 12, 10, 0, Math.PI, 0); ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.ellipse(sx + p.w / 2 - 4, sy + 4, 4, 5, -0.2, Math.PI, 0); ctx.fill();
            ctx.beginPath(); ctx.ellipse(sx + p.w / 2 + 4, sy + 4, 4, 5, 0.2, Math.PI, 0); ctx.fill();
            ctx.fillStyle = '#FFF5E0';
            ctx.fillRect(sx + 6, sy + 8, 12, 10);
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(sx + 8, sy + 11, 2, 2);
            ctx.fillRect(sx + 14, sy + 11, 2, 2);
            ctx.fillStyle = '#FF6B8A';
            ctx.fillRect(sx + 11, sy + 14, 2, 1);
        } else if (p.type === 'fire') {
            // Fire flower (same as existing)
            const sx = px, sy = py + bob;
            const pulse = 0.8 + Math.sin(p.anim * 6) * 0.2;
            ctx.fillStyle = '#228B22';
            ctx.fillRect(sx + 10, sy + 14, 4, 10);
            ctx.fillStyle = '#32CD32';
            ctx.fillRect(sx + 6, sy + 16, 6, 3);
            ctx.fillRect(sx + 12, sy + 18, 6, 3);
            ctx.fillStyle = '#FF4500';
            ctx.beginPath(); ctx.arc(sx + 12, sy + 8, 8 * pulse, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFD700';
            ctx.beginPath(); ctx.arc(sx + 12, sy + 8, 5 * pulse, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.arc(sx + 12, sy + 8, 2, 0, Math.PI * 2); ctx.fill();
        } else if (p.type === 'speed') {
            // Lightning bolt
            const sx = px + 6, sy = py + 2 + bob;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(sx + 8, sy); ctx.lineTo(sx + 14, sy);
            ctx.lineTo(sx + 8, sy + 10); ctx.lineTo(sx + 12, sy + 10);
            ctx.lineTo(sx + 4, sy + 22); ctx.lineTo(sx + 8, sy + 12);
            ctx.lineTo(sx + 4, sy + 12);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#FFF8DC';
            ctx.beginPath();
            ctx.moveTo(sx + 9, sy + 2); ctx.lineTo(sx + 12, sy + 2);
            ctx.lineTo(sx + 9, sy + 8); ctx.lineTo(sx + 7, sy + 8);
            ctx.closePath(); ctx.fill();
        } else if (p.type === 'shield') {
            // Blue shield
            const sx = px + 4, sy = py + 2 + bob;
            ctx.fillStyle = '#4488FF';
            ctx.beginPath();
            ctx.moveTo(sx + 8, sy); ctx.lineTo(sx + 16, sy + 4);
            ctx.lineTo(sx + 16, sy + 12); ctx.quadraticCurveTo(sx + 8, sy + 22, sx + 8, sy + 22);
            ctx.quadraticCurveTo(sx + 8, sy + 22, sx, sy + 12);
            ctx.lineTo(sx, sy + 4);
            ctx.closePath(); ctx.fill();
            // Highlight
            ctx.fillStyle = '#88BBFF';
            ctx.beginPath();
            ctx.moveTo(sx + 8, sy + 2); ctx.lineTo(sx + 14, sy + 5);
            ctx.lineTo(sx + 14, sy + 10); ctx.quadraticCurveTo(sx + 8, sy + 16, sx + 8, sy + 16);
            ctx.closePath(); ctx.fill();
            // Center star
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.arc(sx + 8, sy + 10, 2, 0, Math.PI * 2); ctx.fill();
        }
    }

    function startScratch() {
        scratchTimer = 8;
        scratchCooldown = 15;
        shakeTimer = 3; shakeAmt = 2;
        // Claw slash particles
        const sx = cat.x + (cat.dir === 1 ? cat.w + 8 : -16);
        const sy = cat.y + cat.h / 2;
        for (let i = 0; i < 5; i++) {
            addParticle(sx + (Math.random() - 0.5) * 12, sy + (Math.random() - 0.5) * 20, '#FFF', 1, 3);
        }
        addParticle(sx, sy - 8, '#FFDDAA', 2, 2);
        addParticle(sx, sy + 8, '#FFDDAA', 2, 2);

        // Scratch hitbox (in front of cat)
        const hx = cat.dir === 1 ? cat.x + cat.w - 4 : cat.x - 36;
        const hy = cat.y - 4;
        const hw = 40, hh = cat.h + 8;

        // Hit enemies
        if (level) {
            level.enemies.forEach(e => {
                if (!e.alive) return;
                if (e === heldShell) return;
                if (hx < e.x + e.w && hx + hw > e.x && hy < e.y + e.h && hy + hh > e.y) {
                    if (e.type === 'ratter' && e.shell && !heldShell) {
                        // Pick up shell instead of destroying
                        heldShell = e;
                        e.vx = 0; e.shellVx = 0;
                        addParticle(e.x + e.w / 2, e.y + e.h / 2, '#44AA44', 6, 4);
                    } else {
                        e.alive = false; score += 200;
                        shakeTimer = 6; shakeAmt = 4;
                        addParticle(e.x + e.w / 2, e.y + e.h / 2, '#FF4444', 10, 6);
                        addParticle(e.x + e.w / 2, e.y + e.h / 2, '#FFF', 4, 3);
                    }
                }
            });
        }

        // Hit boss
        if (boss && boss.alive) {
            if (hx < boss.x + boss.w && hx + hw > boss.x && hy < boss.y + boss.h && hy + hh > boss.y) {
                damageBoss(1);
                addParticle(boss.x + boss.w / 2, boss.y + boss.h / 2, '#FFF', 6, 4);
            }
        }
    }
    function updateCoins() {
        if (!level) return;
        level.coins.forEach(cn => {
            if (cn.collected) return;
            cn.anim += COIN_ANIM;
            let ox = cat.x + 4, oy = cat.y + 2, ow = cat.w - 8, oh = cat.h - 2;
            if (ox < cn.x + cn.w && ox + ow > cn.x && oy < cn.y + cn.h && oy + oh > cn.y) {
                cn.collected = true; score += 100; coinCount++;
                addParticle(cn.x + cn.w / 2, cn.y + cn.h / 2, '#FFD700', 8, 4);
            }
            // P2 coin collect
            if (coopMode && !cat2.dead) {
                let ox2 = cat2.x + 4, oy2 = cat2.y + 2, ow2 = cat2.w - 8, oh2 = cat2.h - 2;
                if (ox2 < cn.x + cn.w && ox2 + ow2 > cn.x && oy2 < cn.y + cn.h && oy2 + oh2 > cn.y) {
                    cn.collected = true; score += 100; coinCount++;
                    addParticle(cn.x + cn.w / 2, cn.y + cn.h / 2, '#FFD700', 8, 4);
                }
            }
        });
    }

    // 1-UPS
    function updateOneUps() {
        if (!level) return;
        level.oneUps.forEach(u => {
            if (u.collected) return;
            u.bob += 0.04;
            let ox = cat.x + 4, oy = cat.y + 2, ow = cat.w - 8, oh = cat.h - 2;
            if (ox < u.x + u.w && ox + ow > u.x && oy < u.y + u.h && oy + oh > u.y) {
                u.collected = true; lives++; score += 500;
                addParticle(u.x + u.w / 2, u.y + u.h / 2, '#00FF88', 15, 6);
                addParticle(u.x + u.w / 2, u.y, '#FFFFFF', 5, 3);
            }
            if (coopMode && !cat2.dead) {
                let ox2 = cat2.x + 4, oy2 = cat2.y + 2, ow2 = cat2.w - 8, oh2 = cat2.h - 2;
                if (ox2 < u.x + u.w && ox2 + ow2 > u.x && oy2 < u.y + u.h && oy2 + oh2 > u.y) {
                    u.collected = true; lives++; score += 500;
                    addParticle(u.x + u.w / 2, u.y + u.h / 2, '#00FF88', 15, 6);
                }
            }
        });
    }

    function drawOneUp(u) {
        if (u.collected) return;
        const sx = Math.round(u.x - cam.x), bobY = Math.sin(u.bob) * 3;
        const sy = Math.round(u.y + bobY);
        if (sx < -T || sx > W + T) return;
        // Green mushroom cap
        ctx.fillStyle = '#22CC66';
        ctx.beginPath();
        ctx.ellipse(sx + u.w / 2, sy + 8, 12, 10, 0, Math.PI, 0);
        ctx.fill();
        // White spots on cap
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(sx + u.w / 2 - 4, sy + 4, 4, 5, -0.2, Math.PI, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(sx + u.w / 2 + 4, sy + 4, 4, 5, 0.2, Math.PI, 0);
        ctx.fill();
        // Stem
        ctx.fillStyle = '#FFF5E0';
        ctx.fillRect(sx + 6, sy + 8, 12, 10);
        // Cat face on mushroom
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(sx + 8, sy + 11, 2, 2);
        ctx.fillRect(sx + 14, sy + 11, 2, 2);
        ctx.fillStyle = '#FF6B8A';
        ctx.fillRect(sx + 11, sy + 14, 2, 1);
        // "1UP" label
        ctx.fillStyle = '#00FF88';
        ctx.font = '7px monospace';
        ctx.fillText('1UP', sx + 3, sy - 2);
        // Glow
        ctx.globalAlpha = 0.15 + Math.sin(u.bob * 2) * 0.1;
        ctx.fillStyle = '#00FF88';
        ctx.beginPath();
        ctx.arc(sx + u.w / 2, sy + u.h / 2, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // FIRE FLOWERS
    function updateFireFlowers() {
        if (!level) return;
        level.fireFlowers.forEach(ff => {
            if (ff.collected) return;
            ff.anim += 0.04;
            let ox = cat.x + 4, oy = cat.y + 2, ow = cat.w - 8, oh = cat.h - 2;
            if (ox < ff.x + ff.w && ox + ow > ff.x && oy < ff.y + ff.h && oy + oh > ff.y) {
                ff.collected = true; hasFire = true; score += 300;
                addParticle(ff.x + ff.w / 2, ff.y + ff.h / 2, '#FF4500', 15, 6);
                addParticle(ff.x + ff.w / 2, ff.y, '#FFD700', 8, 4);
            }
            if (coopMode && !cat2.dead) {
                let ox2 = cat2.x + 4, oy2 = cat2.y + 2, ow2 = cat2.w - 8, oh2 = cat2.h - 2;
                if (ox2 < ff.x + ff.w && ox2 + ow2 > ff.x && oy2 < ff.y + ff.h && oy2 + oh2 > ff.y) {
                    ff.collected = true; hasFire = true; score += 300;
                    addParticle(ff.x + ff.w / 2, ff.y + ff.h / 2, '#FF4500', 15, 6);
                }
            }
        });
    }

    function drawFireFlower(ff) {
        if (ff.collected) return;
        const sx = Math.round(ff.x - cam.x), bobY = Math.sin(ff.anim) * 2;
        const sy = Math.round(ff.y + bobY);
        if (sx < -T || sx > W + T) return;
        // Stem
        ctx.fillStyle = '#228B22';
        ctx.fillRect(sx + 10, sy + 14, 4, 14);
        // Leaves
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(sx + 6, sy + 18, 6, 3);
        ctx.fillRect(sx + 12, sy + 20, 6, 3);
        // Flower head (fire-colored)
        const pulse = 0.8 + Math.sin(ff.anim * 3) * 0.2;
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.arc(sx + 12, sy + 8, 8 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(sx + 12, sy + 8, 5 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(sx + 12, sy + 8, 2, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.globalAlpha = 0.12 + Math.sin(ff.anim * 2) * 0.08;
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.arc(sx + 12, sy + 10, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // FIREBALLS
    function shootFireball() {
        fireCooldown = 15;
        const fb = {
            x: cat.x + (cat.dir === 1 ? cat.w : -8),
            y: cat.y + 10,
            w: 10, h: 10,
            vx: cat.dir * 7,
            vy: -2,
            life: 120,
            trail: []
        };
        fireballs.push(fb);
        addParticle(fb.x, fb.y, '#FF4500', 4, 2);
    }

    function updateFireballs() {
        if (fireCooldown > 0) fireCooldown--;
        const m = 4;
        for (let i = fireballs.length - 1; i >= 0; i--) {
            const fb = fireballs[i];
            fb.life--;
            if (fb.life <= 0) { fireballs.splice(i, 1); continue; }

            // Store trail positions
            fb.trail.push({ x: fb.x, y: fb.y });
            if (fb.trail.length > 6) fb.trail.shift();

            // Gravity
            fb.vy += 0.3;
            fb.x += fb.vx;
            fb.y += fb.vy;

            // Bounce off ground
            let footR = Math.floor((fb.y + fb.h) / T);
            let fc1 = Math.floor(fb.x / T), fc2 = Math.floor((fb.x + fb.w) / T);
            let landed = false;
            for (let c = fc1; c <= fc2; c++) {
                if (solid(footR, c)) {
                    fb.y = footR * T - fb.h;
                    fb.vy = -5; // bounce!
                    landed = true;
                    break;
                }
            }

            // Ceiling collision (for hitting lucky blocks above)
            if (fb.vy < 0) {
                let headR = Math.floor(fb.y / T);
                let hc1 = Math.floor(fb.x / T), hc2 = Math.floor((fb.x + fb.w) / T);
                for (let c = hc1; c <= hc2; c++) {
                    if (headR >= 0 && headR < level.rows && c >= 0 && c < level.cols && solid(headR, c)) {
                        if (level.grid[headR][c] === 3 || level.grid[headR][c] === 13) {
                            hitQuestion(headR, c);
                        }
                        fb.vy = 1;
                        break;
                    }
                }
            }

            // Check all tiles the fireball overlaps for lucky blocks
            let fbR1 = Math.floor(fb.y / T), fbR2 = Math.floor((fb.y + fb.h) / T);
            let fbC1 = Math.floor(fb.x / T), fbC2 = Math.floor((fb.x + fb.w) / T);
            let hitLucky = false;
            for (let r = fbR1; r <= fbR2 && !hitLucky; r++) {
                for (let c = fbC1; c <= fbC2 && !hitLucky; c++) {
                    if (r >= 0 && r < level.rows && c >= 0 && c < level.cols && (level.grid[r][c] === 3 || level.grid[r][c] === 13)) {
                        hitQuestion(r, c);
                        addParticle(fb.x + fb.w / 2, fb.y + fb.h / 2, '#FF6600', 6, 3);
                        fireballs.splice(i, 1);
                        hitLucky = true;
                    }
                }
            }
            if (hitLucky) continue;

            // Wall collision — destroy fireball
            let wallC = Math.floor((fb.vx > 0 ? fb.x + fb.w : fb.x) / T);
            let wallR = Math.floor((fb.y + fb.h / 2) / T);
            if (solid(wallR, wallC)) {
                addParticle(fb.x + fb.w / 2, fb.y + fb.h / 2, '#FF6600', 6, 3);
                fireballs.splice(i, 1);
                continue;
            }

            // Off screen
            if (fb.y > level.rows * T + 50 || fb.x < cam.x - 50 || fb.x > cam.x + W + 50) {
                fireballs.splice(i, 1);
                continue;
            }

            // Hit enemies
            if (!level) continue;
            for (const e of level.enemies) {
                if (!e.alive) continue;
                if (fb.x < e.x + e.w && fb.x + fb.w > e.x && fb.y < e.y + e.h && fb.y + fb.h > e.y) {
                    e.alive = false;
                    score += 200;
                    shakeTimer = 4; shakeAmt = 2;
                    addParticle(e.x + e.w / 2, e.y + e.h / 2, '#FF4500', 12, 6);
                    addParticle(e.x + e.w / 2, e.y + e.h / 2, '#FFD700', 6, 4);
                    fireballs.splice(i, 1);
                    break;
                }
            }
        }
    }

    function drawFireball(fb) {
        const sx = Math.round(fb.x - cam.x), sy = Math.round(fb.y);
        // Trail
        fb.trail.forEach((t, idx) => {
            const a = (idx + 1) / fb.trail.length * 0.5;
            const ts = fb.w * (idx + 1) / fb.trail.length * 0.6;
            ctx.globalAlpha = a;
            ctx.fillStyle = '#FF6600';
            ctx.beginPath();
            ctx.arc(t.x - cam.x + fb.w / 2, t.y + fb.h / 2, ts, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        // Main fireball
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.arc(sx + fb.w / 2, sy + fb.h / 2, fb.w / 2 + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(sx + fb.w / 2, sy + fb.h / 2, fb.w / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(sx + fb.w / 2 - 1, sy + fb.h / 2 - 1, 2, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.arc(sx + fb.w / 2, sy + fb.h / 2, fb.w, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // ENEMY ARROWS
    function updateArrows() {
        for (let i = arrows.length - 1; i >= 0; i--) {
            const a = arrows[i];
            a.life--;
            if (a.life <= 0) { arrows.splice(i, 1); continue; }

            // Store trail
            a.trail.push({ x: a.x, y: a.y });
            if (a.trail.length > 4) a.trail.shift();

            // Move
            a.x += a.vx;
            a.y += a.vy;
            // Slight gravity on arrows
            a.vy += 0.02;

            // Wall collision — destroy arrow
            let wallC = Math.floor((a.vx > 0 ? a.x + a.w : a.x) / T);
            let wallR = Math.floor((a.y + a.h / 2) / T);
            if (solid(wallR, wallC)) {
                addParticle(a.x + a.w / 2, a.y + a.h / 2, '#8B4513', 4, 3);
                arrows.splice(i, 1);
                continue;
            }

            // Ground/ceiling collision
            let floorR = Math.floor((a.y + a.h) / T);
            let ceilR = Math.floor(a.y / T);
            let ac1 = Math.floor(a.x / T), ac2 = Math.floor((a.x + a.w) / T);
            let hitTile = false;
            for (let c = ac1; c <= ac2 && !hitTile; c++) {
                if (solid(floorR, c) || solid(ceilR, c)) {
                    addParticle(a.x + a.w / 2, a.y + a.h / 2, '#8B4513', 4, 3);
                    arrows.splice(i, 1);
                    hitTile = true;
                }
            }
            if (hitTile) continue;

            // Off screen
            if (a.y > level.rows * T + 50 || a.x < cam.x - 100 || a.x > cam.x + W + 100) {
                arrows.splice(i, 1);
                continue;
            }

            // Hit P1 cat
            if (!cat.dead && invincibleTimer <= 0) {
                let ox = cat.x + 4, oy = cat.y + 2, ow = cat.w - 8, oh = cat.h - 4;
                if (ox < a.x + a.w && ox + ow > a.x && oy < a.y + a.h && oy + oh > a.y) {
                    if (starPowerTimer > 0) {
                        // Star power destroys arrows
                        addParticle(a.x + a.w / 2, a.y + a.h / 2, '#FFD700', 6, 4);
                        arrows.splice(i, 1);
                        continue;
                    }
                    if (shieldHits > 0) {
                        shieldHits--;
                        addParticle(a.x + a.w / 2, a.y + a.h / 2, '#4488FF', 6, 4);
                        arrows.splice(i, 1);
                        continue;
                    }
                    killCat();
                    arrows.splice(i, 1);
                    continue;
                }
            }

            // Hit P2 cat (co-op)
            if (coopMode && !cat2.dead && invincibleTimer2 <= 0) {
                let ox2 = cat2.x + 4, oy2 = cat2.y + 2, ow2 = cat2.w - 8, oh2 = cat2.h - 4;
                if (ox2 < a.x + a.w && ox2 + ow2 > a.x && oy2 < a.y + a.h && oy2 + oh2 > a.y) {
                    if (starPowerTimer > 0) {
                        addParticle(a.x + a.w / 2, a.y + a.h / 2, '#FFD700', 6, 4);
                        arrows.splice(i, 1);
                        continue;
                    }
                    killCat2();
                    arrows.splice(i, 1);
                    continue;
                }
            }

            // Fireballs destroy arrows
            for (let j = fireballs.length - 1; j >= 0; j--) {
                const fb = fireballs[j];
                if (fb.x < a.x + a.w && fb.x + fb.w > a.x && fb.y < a.y + a.h && fb.y + fb.h > a.y) {
                    addParticle(a.x + a.w / 2, a.y + a.h / 2, '#FF6600', 8, 4);
                    addParticle(a.x + a.w / 2, a.y + a.h / 2, '#8B4513', 4, 3);
                    arrows.splice(i, 1);
                    fireballs.splice(j, 1);
                    break;
                }
            }
        }
    }

    function drawArrow(a) {
        const sx = Math.round(a.x - cam.x), sy = Math.round(a.y);
        if (sx < -20 || sx > W + 20) return;
        const angle = Math.atan2(a.vy, a.vx);
        ctx.save();
        ctx.translate(sx + a.w / 2, sy + a.h / 2);
        ctx.rotate(angle);
        // Shaft
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(-8, -1, 16, 2);
        // Arrowhead
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(5, -3);
        ctx.lineTo(5, 3);
        ctx.closePath();
        ctx.fill();
        // Fletching
        ctx.fillStyle = '#CC3333';
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-11, -3);
        ctx.lineTo(-9, 0);
        ctx.lineTo(-11, 3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // BOSS AI
    function updateBoss() {
        if (!boss) return;
        // Handle boss death animation
        if (!boss.alive) {
            if (boss.deathTimer > 0) {
                boss.deathTimer--;
                if (boss.deathTimer % 8 < 4) {
                    addParticle(boss.x + Math.random() * boss.w, boss.y + Math.random() * boss.h, ['#FF4500', '#FFD700', '#FF0000', '#FFA500'][Math.floor(Math.random() * 4)], 3, 4);
                }
                if (boss.deathTimer <= 0) {
                    if (boss.pirate) {
                        // Pirate boss = continue to caves
                        state = 'levelcomplete'; winTimer = 120; score += 10000; coinCount += 200;
                        showOverlay('🏴‍☠️ PIRATE CAPTAIN DEFEATED!', 'THE DEPTHS AWAIT...\n\nSCORE: ' + score + '\n\nPRESS SPACE TO CONTINUE');
                    } else {
                        // Rat King = continue to sky levels
                        state = 'levelcomplete'; winTimer = 120; score += 5000; coinCount += 100;
                        showOverlay('👑 RAT KING DEFEATED!', 'THE SKIES AWAIT...\n\nSCORE: ' + score + '\n\nPRESS SPACE TO CONTINUE');
                    }
                }
            }
            return;
        }
        boss.frame += 0.05;

        // Gravity
        boss.vy = Math.min(boss.vy + 0.5, MAX_FALL);
        boss.y += boss.vy;

        // Ground collision
        let footR = Math.floor((boss.y + boss.h) / T);
        let bc1 = Math.floor((boss.x + 8) / T), bc2 = Math.floor((boss.x + boss.w - 8) / T);
        boss.grounded = false;
        for (let c = bc1; c <= bc2; c++) {
            if (solid(footR, c)) {
                boss.y = footR * T - boss.h;
                boss.vy = 0;
                boss.grounded = true;
                break;
            }
        }

        // Wall collision (check multiple rows to prevent clipping)
        boss.x += boss.vx;
        if (boss.vx > 0) {
            let wc = Math.floor((boss.x + boss.w) / T);
            let wr1 = Math.floor((boss.y + 4) / T);
            let wr2 = Math.floor((boss.y + boss.h / 2) / T);
            let wr3 = Math.floor((boss.y + boss.h - 4) / T);
            if (solid(wr1, wc) || solid(wr2, wc) || solid(wr3, wc)) {
                boss.x = wc * T - boss.w; boss.vx = 0; boss.dir *= -1;
            }
        } else if (boss.vx < 0) {
            let wc = Math.floor(boss.x / T);
            let wr1 = Math.floor((boss.y + 4) / T);
            let wr2 = Math.floor((boss.y + boss.h / 2) / T);
            let wr3 = Math.floor((boss.y + boss.h - 4) / T);
            if (solid(wr1, wc) || solid(wr2, wc) || solid(wr3, wc)) {
                boss.x = (wc + 1) * T; boss.vx = 0; boss.dir *= -1;
            }
        }

        // Keep in level bounds (2 tiles from edges)
        if (boss.x < T * 2) { boss.x = T * 2; boss.vx = 0; boss.dir = 1; }
        if (boss.x + boss.w > (level.cols - 2) * T) { boss.x = (level.cols - 2) * T - boss.w; boss.vx = 0; boss.dir = -1; }

        // Flash timer
        if (boss.flashTimer > 0) boss.flashTimer--;

        // Phase AI
        boss.phaseTimer--;
        boss.dir = cat.x < boss.x ? -1 : 1;

        if (boss.phase === 'idle') {
            boss.vx = 0;
            if (boss.phaseTimer <= 0) {
                boss.attackCount++;
                // Choose attack based on HP
                if (boss.hp <= 3 && boss.attackCount % 3 === 0) {
                    boss.phase = 'spawn';
                    boss.phaseTimer = 60;
                } else if (boss.attackCount % 2 === 0) {
                    boss.phase = 'jump';
                    boss.phaseTimer = 80;
                } else {
                    boss.phase = 'charge';
                    boss.phaseTimer = 90;
                }
            }
        } else if (boss.phase === 'charge') {
            boss.vx = boss.dir * 4;
            if (boss.phaseTimer <= 0) { boss.phase = 'idle'; boss.phaseTimer = 40; boss.vx = 0; }
        } else if (boss.phase === 'jump') {
            if (boss.phaseTimer === 78 && boss.grounded) {
                boss.vy = -14;
                boss.vx = boss.dir * 3;
            }
            if (boss.grounded && boss.phaseTimer < 60) {
                shakeTimer = 8; shakeAmt = 4;
                boss.phase = 'idle'; boss.phaseTimer = 50; boss.vx = 0;
            }
        } else if (boss.phase === 'spawn') {
            boss.vx = 0;
            if (boss.phaseTimer === 30) {
                // Spawn 2 rat minions
                level.enemies.push({ x: boss.x - 40, y: boss.y + 32, w: T, h: T, vx: -ENEMY_SPEED * 1.5, vy: 0, type: 'rat', alive: true, frame: 0 });
                level.enemies.push({ x: boss.x + boss.w + 8, y: boss.y + 32, w: T, h: T, vx: ENEMY_SPEED * 1.5, vy: 0, type: 'rat', alive: true, frame: 0 });
                addParticle(boss.x + boss.w / 2, boss.y + boss.h, '#8B4513', 10, 5);
            }
            if (boss.phaseTimer <= 0) { boss.phase = 'idle'; boss.phaseTimer = 60; }
        } else if (boss.phase === 'hurt') {
            boss.vx = 0;
            if (boss.phaseTimer <= 0) { boss.phase = 'idle'; boss.phaseTimer = 30; }
        }

        // Cat collision
        if (!cat.dead) {
            let ox = cat.x + 4, oy = cat.y + 2, ow = cat.w - 8, oh = cat.h - 4;
            if (ox < boss.x + boss.w && ox + ow > boss.x && oy < boss.y + boss.h && oy + oh > boss.y) {
                if (starPowerTimer > 0) {
                    // Star power: deal 1 damage to boss
                    damageBoss(1);
                    cat.vy = JUMP * 0.5;
                    invincibleTimer = 30;
                    addParticle(boss.x + boss.w / 2, boss.y + boss.h / 2, '#FFD700', 15, 6);
                } else if (invincibleTimer <= 0) {
                    if (cat.vy > 0 && cat.y + cat.h - 10 < boss.y + 20) {
                        damageBoss(1);
                        cat.vy = JUMP * 0.7;
                    } else {
                        killCat();
                    }
                }
            }
        }

        // Fireball collision
        for (let i = fireballs.length - 1; i >= 0; i--) {
            const fb = fireballs[i];
            if (fb.x < boss.x + boss.w && fb.x + fb.w > boss.x && fb.y < boss.y + boss.h && fb.y + fb.h > boss.y) {
                damageBoss(2);
                addParticle(fb.x + fb.w / 2, fb.y + fb.h / 2, '#FF4500', 8, 4);
                fireballs.splice(i, 1);
            }
        }
    }

    function damageBoss(dmg) {
        if (!boss || !boss.alive || boss.flashTimer > 0) return;
        boss.hp -= dmg;
        boss.flashTimer = 20;
        boss.phase = 'hurt';
        boss.phaseTimer = 25;
        shakeTimer = 10; shakeAmt = 5;
        addParticle(boss.x + boss.w / 2, boss.y + boss.h / 2, '#FF0000', 15, 7);
        score += 100;
        if (boss.hp <= 0) {
            boss.alive = false;
            boss.deathTimer = 120;
            addParticle(boss.x + boss.w / 2, boss.y + boss.h / 2, '#FFD700', 30, 10);
            addParticle(boss.x + boss.w / 2, boss.y + boss.h / 2, '#FF4500', 20, 8);
            score += 5000;
        }
    }

    function drawBoss() {
        if (!boss) return;
        if (!boss.alive) return; // death particles handled by updateBoss
        if (boss.flashTimer > 0 && boss.flashTimer % 4 < 2) return; // damage flash

        const bx = Math.round(boss.x - cam.x), by = Math.round(boss.y);
        const d = boss.dir;
        const f = d === -1;
        function bpx(rx, ry, w, h, col) {
            ctx.fillStyle = col;
            ctx.fillRect(f ? bx + boss.w - rx - w : bx + rx, by + ry, w, h);
        }

        // Big body
        bpx(8, 20, 48, 36, '#5C3310');
        bpx(12, 24, 40, 28, '#7A4420');
        // Head
        bpx(32, 2, 30, 28, '#5C3310');
        bpx(34, 6, 26, 22, '#7A4420');
        // Crown!
        bpx(34, -6, 26, 12, '#FFD700');
        bpx(36, -10, 6, 8, '#FFD700');
        bpx(44, -12, 6, 10, '#FFD700');
        bpx(52, -10, 6, 8, '#FFD700');
        // Crown jewels
        bpx(38, -6, 3, 3, '#FF0000');
        bpx(46, -8, 3, 3, '#0088FF');
        bpx(54, -6, 3, 3, '#FF0000');
        // Ears
        bpx(34, -2, 8, 10, '#5C3310');
        bpx(54, -2, 8, 10, '#5C3310');
        bpx(36, 0, 4, 6, '#CC8866');
        bpx(56, 0, 4, 6, '#CC8866');
        // Eyes — angry!
        bpx(38, 12, 6, 6, '#FF0000');
        bpx(50, 12, 6, 6, '#FF0000');
        bpx(40, 14, 3, 3, '#1a1a2e');
        bpx(52, 14, 3, 3, '#1a1a2e');
        // Angry eyebrows
        bpx(36, 10, 8, 2, '#2a1a0e');
        bpx(50, 10, 8, 2, '#2a1a0e');
        // Fangs
        bpx(42, 22, 4, 6, '#FFF');
        bpx(50, 22, 4, 6, '#FFF');
        // Tail
        const tw = Math.sin(boss.frame * 2) * 4;
        bpx(-8, 28 + tw, 16, 6, '#5C3310');
        bpx(-14, 22 + tw, 10, 8, '#4A2800');
        // Legs
        const ll = Math.sin(boss.frame * 4) * 3;
        bpx(12, 54, 10, 8 + ll, '#4A2800');
        bpx(28, 54, 10, 8 - ll, '#4A2800');
        bpx(40, 54, 10, 8 + ll, '#4A2800');

        // Attack indicators
        if (boss.phase === 'charge') {
            if (frameCount % 3 === 0) addParticle(boss.x + (d === 1 ? 0 : boss.w), boss.y + boss.h, '#8B6914', 2, 3);
        }

        // Pirate boss overlay accessories
        if (boss.pirate) {
            // Tricorn hat (replaces crown)
            bpx(30, -10, 34, 6, '#222');   // hat brim
            bpx(34, -18, 26, 10, '#222');  // hat crown
            bpx(36, -14, 22, 3, '#CC1111'); // hat band
            // Skull emblem on hat
            bpx(44, -17, 6, 5, '#FFF');
            bpx(43, -13, 8, 2, '#FFF');
            // Eye patch
            bpx(38, 12, 6, 6, '#111');
            bpx(37, 8, 2, 6, '#111');
            // Hook hand
            bpx(-2, 36, 6, 12, '#C0C0C0');
            bpx(-4, 32, 4, 6, '#C0C0C0');
            bpx(-6, 30, 4, 4, '#C0C0C0');
            // Captain's coat collar
            bpx(10, 18, 4, 10, '#CC1111');
            bpx(50, 18, 4, 10, '#CC1111');
            // Gold buttons
            bpx(28, 28, 3, 3, '#FFD700');
            bpx(28, 36, 3, 3, '#FFD700');
            bpx(28, 44, 3, 3, '#FFD700');
        }
    }

    function drawBossHP() {
        if (!boss || !boss.alive) return;
        const barW = 200, barH = 14;
        const barX = (W - barW) / 2, barY = 10;
        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
        // HP bar
        const hpRatio = Math.max(0, boss.hp / boss.maxHp);
        const hpColor = hpRatio > 0.5 ? '#FF4444' : hpRatio > 0.25 ? '#FF8800' : '#FF0000';
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX, barY, barW * hpRatio, barH);
        // Border
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);
        // Label
        ctx.fillStyle = '#FFF';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(boss.pirate ? 'PIRATE CAPTAIN' : 'RAT KING', barX, barY - 5);
    }

    // FLAG / CASTLE CHECK
    function checkFlag() {
        if (!level) return;
        // Boss level has no flag — victory handled by boss death
        if (boss) return;

        // Helper: check if a cat touches a door tile
        function touchesDoor(c) {
            if (c.dead) return false;
            let r1 = Math.floor((c.y + 4) / T), r2 = Math.floor((c.y + c.h - 4) / T);
            let c1 = Math.floor((c.x + 4) / T), c2 = Math.floor((c.x + c.w - 4) / T);
            for (let r = r1; r <= r2; r++) {
                for (let cc = c1; cc <= c2; cc++) {
                    if (r >= 0 && r < level.rows && cc >= 0 && cc < level.cols && level.grid[r][cc] === 12) return true;
                }
            }
            return false;
        }

        // Castle door check
        if (currentLevel === 2 || currentLevel === 3) {
            if (touchesDoor(cat) || (coopMode && touchesDoor(cat2))) {
                state = 'levelcomplete'; winTimer = 120; score += 1000;
                if (currentLevel === 2) {
                    showOverlay('\ud83c\udff0 RAT KING\'S CASTLE', 'ENTERING THE CASTLE...\n\nPRESS SPACE TO CONTINUE');
                } else {
                    showOverlay('\u2694\ufe0f THE THRONE ROOM', 'THE RAT KING AWAITS...\n\nPRESS SPACE TO CONTINUE');
                }
            }
            return;
        }

        let fc = level.flagX, fy = level.flagY;
        if (fc === 0) return;
        let flagPx = fc * T;
        const p1AtFlag = !cat.dead && cat.x + cat.w > flagPx && cat.x < flagPx + T;
        const p2AtFlag = coopMode && !cat2.dead && cat2.x + cat2.w > flagPx && cat2.x < flagPx + T;
        if (p1AtFlag || p2AtFlag) {
            if (currentLevel < LEVEL_DATA.length - 1) { state = 'levelcomplete'; winTimer = 120; score += 1000; }
            else { state = 'win'; score += 5000; }
        }
    }

    // DRAWING
    function drawTile(r, c, type) {
        const x = c * T - cam.x, y = r * T;
        if (x < -T || x > W + T) return;
        const colors = TILE_COLORS[type];
        if (!colors) return;
        // Underground cave rock rendering for G-blocks
        if (type === 1 && currentLevel >= 11) {
            ctx.fillStyle = '#555'; ctx.fillRect(x, y, T, T);
            ctx.fillStyle = '#666'; ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
            // Rock texture cracks
            ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x + 4, y + 3); ctx.lineTo(x + 12, y + 10); ctx.lineTo(x + 8, y + 20); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + 20, y + 5); ctx.lineTo(x + 26, y + 14); ctx.stroke();
            // Random crystal sparkle
            if ((r * 7 + c * 13) % 17 === 0) {
                ctx.fillStyle = '#88FFFF'; ctx.fillRect(x + 10, y + 8, 3, 3);
                ctx.fillStyle = '#AFFFFF'; ctx.fillRect(x + 11, y + 9, 1, 1);
            }
            if ((r * 11 + c * 3) % 23 === 0) {
                ctx.fillStyle = '#FF6644'; ctx.fillRect(x + 20, y + 18, 3, 3);
                ctx.fillStyle = '#FF9966'; ctx.fillRect(x + 21, y + 19, 1, 1);
            }
            return;
        }
        ctx.fillStyle = colors[0]; ctx.fillRect(x, y, T, T);
        // Inner highlight
        ctx.fillStyle = colors[1]; ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
        // Question block icon
        if (type === 3) {
            ctx.fillStyle = '#FFF8DC'; ctx.font = 'bold 18px monospace';
            ctx.fillText('?', x + 9, y + 23);
        }
        // Rare question block (rainbow shimmer + star icon)
        if (type === 13) {
            const rainbow = ['#FF4444', '#FF8800', '#FFFF00', '#44FF44', '#4488FF', '#AA44FF'];
            const ci = Math.floor(frameCount / 4) % rainbow.length;
            ctx.fillStyle = rainbow[ci]; ctx.fillRect(x, y, T, T);
            ctx.fillStyle = rainbow[(ci + 2) % 6]; ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
            // Sparkle border
            ctx.strokeStyle = '#FFF'; ctx.lineWidth = 1;
            ctx.globalAlpha = 0.4 + Math.sin(frameCount * 0.1) * 0.3;
            ctx.strokeRect(x + 1, y + 1, T - 2, T - 2);
            ctx.globalAlpha = 1;
            // Star icon
            ctx.fillStyle = '#FFF'; ctx.font = 'bold 16px monospace';
            ctx.fillText('★', x + 8, y + 22);
        }
        // Brick lines / Ship planks
        if (type === 2) {
            if (currentLevel >= 5 && currentLevel <= 10) {
                // Sky levels: wooden ship planks
                ctx.fillStyle = '#6B4226'; ctx.fillRect(x, y, T, T);
                ctx.fillStyle = '#8B5A2B'; ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
                // Wood grain
                ctx.strokeStyle = '#5C3317'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(x + 2, y + 6); ctx.lineTo(x + T - 2, y + 6); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x + 2, y + 16); ctx.lineTo(x + T - 2, y + 16); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x + 2, y + 26); ctx.lineTo(x + T - 2, y + 26); ctx.stroke();
                // Nail details
                ctx.fillStyle = '#444';
                ctx.fillRect(x + 3, y + 3, 2, 2);
                ctx.fillRect(x + T - 5, y + 3, 2, 2);
                ctx.fillRect(x + 3, y + T - 5, 2, 2);
                ctx.fillRect(x + T - 5, y + T - 5, 2, 2);
            } else {
                ctx.strokeStyle = '#7A2E1A'; ctx.lineWidth = 1;
                ctx.strokeRect(x + 1, y + 1, T - 2, T / 2 - 1);
                ctx.beginPath(); ctx.moveTo(x + T / 2, y + T / 2); ctx.lineTo(x + T / 2, y + T); ctx.stroke();
            }
        }
        // Castle wall brick pattern
        if (type === 11) {
            ctx.fillStyle = '#B5451B'; ctx.fillRect(x, y, T, T);
            ctx.fillStyle = '#C85A28'; ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
            // Brick mortar lines
            ctx.strokeStyle = '#8B3A10'; ctx.lineWidth = 1;
            // Horizontal mortar
            ctx.beginPath(); ctx.moveTo(x, y + T / 2); ctx.lineTo(x + T, y + T / 2); ctx.stroke();
            // Vertical mortar (offset between rows)
            ctx.beginPath(); ctx.moveTo(x + T / 2, y); ctx.lineTo(x + T / 2, y + T / 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x, y + T / 2); ctx.lineTo(x, y + T); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + T, y + T / 2); ctx.lineTo(x + T, y + T); ctx.stroke();
            // Subtle highlight on top-left of bricks
            ctx.fillStyle = 'rgba(255,200,150,0.15)';
            ctx.fillRect(x + 1, y + 1, T / 2 - 1, 2);
            ctx.fillRect(x + 1, y + T / 2 + 1, T - 2, 2);
        }
        // Castle door (arched)
        if (type === 12) {
            ctx.fillStyle = '#B5451B'; ctx.fillRect(x, y, T, T);
            ctx.fillStyle = '#111'; ctx.fillRect(x + 4, y + 2, T - 8, T - 2);
            // Arch top
            ctx.beginPath(); ctx.arc(x + T / 2, y + 8, (T - 8) / 2, Math.PI, 0); ctx.fill();
        }
    }

    function drawCatSprite() {
        if (cat.dead && deathTimer > 30) {
            const dy = Math.sin(deathTimer * 0.1) * 5;
            drawCatBody(cat.x - cam.x, cat.y + dy); return;
        }
        if (cat.dead) return;
        if (invincibleTimer > 0 && frameCount % 4 < 2) return;
        if (isBig) {
            ctx.save();
            ctx.translate(cat.x - cam.x, cat.y + cat.h);
            ctx.scale(1, 2);
            drawCatBody(0, -32);
            ctx.restore();
        } else {
            drawCatBody(cat.x - cam.x, cat.y);
        }
        // Draw held shell above cat
        if (heldShell) {
            const hsx = Math.round(cat.x - cam.x) + cat.w / 2 - 14;
            const hsy = Math.round(cat.y) - 20;
            ctx.fillStyle = '#2E8B57';
            ctx.beginPath(); ctx.ellipse(hsx + 14, hsy + 12, 14, 12, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1E6B3A';
            ctx.fillRect(hsx + 6, hsy + 8, 6, 8);
            ctx.fillRect(hsx + 16, hsy + 8, 6, 8);
            ctx.strokeStyle = '#1a5a30'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.ellipse(hsx + 14, hsy + 12, 14, 12, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.lineWidth = 1;
        }
        // Star power rainbow effect
        if (starPowerTimer > 0) {
            const rainbow = ['#FF0000', '#FF8800', '#FFFF00', '#00FF00', '#0088FF', '#8800FF'];
            const ci = Math.floor(frameCount / 2) % rainbow.length;
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = rainbow[ci];
            ctx.fillRect(Math.round(cat.x - cam.x), Math.round(cat.y), cat.w, cat.h);
            ctx.globalAlpha = 1;
            // Sparkle trail
            if (frameCount % 2 === 0) {
                addParticle(cat.x + Math.random() * cat.w, cat.y + Math.random() * cat.h, rainbow[Math.floor(Math.random() * 6)], 2, 4);
            }
        }
        // Glide wing visual
        if (isGliding) {
            const gx = Math.round(cat.x - cam.x);
            const gy = Math.round(cat.y);
            const flap = Math.sin(frameCount * 0.2) * 6;
            ctx.globalAlpha = 0.6;
            // Left wing
            ctx.fillStyle = '#C0E8FF';
            ctx.beginPath();
            ctx.moveTo(gx + 2, gy + 8);
            ctx.quadraticCurveTo(gx - 14, gy + 4 + flap, gx - 20, gy + 14 + flap);
            ctx.lineTo(gx + 2, gy + 20);
            ctx.closePath();
            ctx.fill();
            // Right wing
            ctx.beginPath();
            ctx.moveTo(gx + cat.w - 2, gy + 8);
            ctx.quadraticCurveTo(gx + cat.w + 14, gy + 4 + flap, gx + cat.w + 20, gy + 14 + flap);
            ctx.lineTo(gx + cat.w - 2, gy + 20);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        // Scratch claw effect
        if (scratchTimer > 0) {
            const sx = Math.round(cat.x - cam.x);
            const sy = Math.round(cat.y);
            const cx = cat.dir === 1 ? sx + cat.w + 2 : sx - 18;
            const progress = 1 - scratchTimer / 8;
            ctx.globalAlpha = 0.7 + 0.3 * (1 - progress);
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            // Three claw lines
            for (let i = -1; i <= 1; i++) {
                const oy = sy + 8 + i * 8;
                const len = 16 * progress;
                ctx.beginPath();
                ctx.moveTo(cx, oy);
                ctx.lineTo(cx + cat.dir * len, oy + 4 * progress);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            ctx.lineWidth = 1;
        }
    }

    function drawCat2Sprite() {
        if (!coopMode) return;
        if (cat2.dead && cat2DeathTimer > 30) {
            const dy = Math.sin(cat2DeathTimer * 0.1) * 5;
            // Temporarily swap to draw cat2
            const savedDir = cat.dir, savedSkin = selectedSkin, savedW = cat.w, savedH = cat.h;
            cat.dir = cat2.dir; selectedSkin = cat2SelectedSkin; cat.w = cat2.w; cat.h = cat2.h;
            drawCatBody(cat2.x - cam.x, cat2.y + dy);
            cat.dir = savedDir; selectedSkin = savedSkin; cat.w = savedW; cat.h = savedH;
            return;
        }
        if (cat2.dead) return;
        if (invincibleTimer2 > 0 && frameCount % 4 < 2) return;
        // Save P1 state, swap to P2
        const savedDir = cat.dir, savedSkin = selectedSkin, savedW = cat.w, savedH = cat.h;
        cat.dir = cat2.dir; selectedSkin = cat2SelectedSkin; cat.w = cat2.w; cat.h = cat2.h;
        if (isBig2) {
            ctx.save();
            ctx.translate(cat2.x - cam.x, cat2.y + cat2.h);
            ctx.scale(1, 2);
            drawCatBody(0, -32);
            ctx.restore();
        } else {
            drawCatBody(cat2.x - cam.x, cat2.y);
        }
        // Restore P1 state
        cat.dir = savedDir; selectedSkin = savedSkin; cat.w = savedW; cat.h = savedH;
        // Held shell
        if (heldShell2) {
            const hsx = Math.round(cat2.x - cam.x) + cat2.w / 2 - 14;
            const hsy = Math.round(cat2.y) - 20;
            ctx.fillStyle = '#2E8B57';
            ctx.beginPath(); ctx.ellipse(hsx + 14, hsy + 12, 14, 12, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#1a5a30'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.ellipse(hsx + 14, hsy + 12, 14, 12, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.lineWidth = 1;
        }
        // Scratch claw effect
        if (cat2ScratchTimer > 0) {
            const sx = Math.round(cat2.x - cam.x);
            const sy = Math.round(cat2.y);
            const cx = cat2.dir === 1 ? sx + cat2.w + 2 : sx - 18;
            const progress = 1 - cat2ScratchTimer / 8;
            ctx.globalAlpha = 0.7 + 0.3 * (1 - progress);
            ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2;
            for (let i = -1; i <= 1; i++) {
                const oy = sy + 8 + i * 8;
                const len = 16 * progress;
                ctx.beginPath(); ctx.moveTo(cx, oy); ctx.lineTo(cx + cat2.dir * len, oy + 4 * progress); ctx.stroke();
            }
            ctx.globalAlpha = 1; ctx.lineWidth = 1;
        }
        // P2 label
        ctx.fillStyle = '#88CCFF';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('P2', Math.round(cat2.x - cam.x) + cat2.w / 2, Math.round(cat2.y) - 6);
        ctx.textAlign = 'left';
    }

    function drawCatBody(sx, sy) {
        const d = cat.dir; const cx = Math.round(sx), cy = Math.round(sy);
        const f = d === -1;
        const skin = CAT_SKINS[selectedSkin];
        function px(rx, ry, w, h, col) {
            ctx.fillStyle = col;
            ctx.fillRect(f ? cx + cat.w - rx - w : cx + rx, cy + ry, w, h);
        }
        // Body
        px(2, 10, 20, 16, skin.body); px(4, 12, 16, 12, skin.highlight);
        // Head
        px(6, 0, 16, 14, skin.body); px(8, 2, 12, 10, skin.highlight);
        // Ears
        px(6, -4, 4, 6, skin.body); px(16, -4, 4, 6, skin.body);
        px(7, -3, 2, 4, skin.ear); px(17, -3, 2, 4, skin.ear);
        // Hat (color changes with power-ups)
        let hatCol = '#CC2222', bandCol = '#FFD700'; // default red hat
        if (hasFire) { hatCol = '#FFFFFF'; bandCol = '#FF6600'; }
        else if (shieldHits > 0) { hatCol = '#3366CC'; bandCol = '#66CCFF'; }
        else if (speedBoost > 0) { hatCol = '#FFCC00'; bandCol = '#FFFFFF'; }
        px(4, -6, 18, 3, hatCol);   // brim
        px(8, -12, 10, 6, hatCol);  // crown
        px(8, -7, 10, 2, bandCol);  // band
        // Eyes
        px(9, 4, 3, 3, '#FFF'); px(14, 4, 3, 3, '#FFF');
        px(10, 5, 2, 2, '#1a1a2e'); px(15, 5, 2, 2, '#1a1a2e');
        // Nose
        px(12, 8, 2, 2, skin.nose);
        // Whiskers
        px(2, 7, 4, 1, '#DDD'); px(20, 7, 4, 1, '#DDD');
        px(2, 9, 5, 1, '#DDD'); px(19, 9, 5, 1, '#DDD');
        // Tail
        const tw = Math.sin(frameCount * 0.12) * 2;
        px(-4, 8 + tw, 6, 4, skin.body); px(-6, 5 + tw, 4, 5, skin.legs);
        // Legs
        if (cat.grounded && (keys.left || keys.right)) {
            const lo = Math.sin(frameCount * 0.35) * 3;
            px(4, 26, 4, Math.max(2, 5 + lo), skin.legs); px(12, 26, 4, Math.max(2, 5 - lo), skin.legs);
            px(18, 26, 4, Math.max(2, 5 + lo), skin.legs);
            px(4, 30 + lo, 5, 2, skin.paw); px(12, 30 - lo, 5, 2, skin.paw); px(18, 30 + lo, 5, 2, skin.paw);
        } else if (!cat.grounded) {
            px(4, 24, 4, 4, skin.legs); px(12, 26, 4, 4, skin.legs); px(18, 24, 4, 4, skin.legs);
        } else {
            px(4, 26, 4, 5, skin.legs); px(12, 26, 4, 5, skin.legs); px(18, 26, 4, 5, skin.legs);
            px(4, 30, 5, 2, skin.paw); px(12, 30, 5, 2, skin.paw); px(18, 30, 5, 2, skin.paw);
        }
    }

    function drawEnemy(e) {
        if (!e.alive) return;
        const ex = Math.round(e.x - cam.x), ey = Math.round(e.y);
        if (ex < -T || ex > W + T) return;

        const isCave = currentLevel >= 11;
        const isSky = currentLevel >= 5 && currentLevel <= 10;

        // === RATTER (Koopa-style rat) ===
        if (e.type === 'ratter') {
            if (e.shell) {
                // Shell mode — green spinning shell
                const spinAngle = e.shellVx !== 0 ? e.frame * 8 : 0;
                ctx.save();
                ctx.translate(ex + e.w / 2, ey + e.h / 2);
                if (e.shellVx !== 0) ctx.rotate(spinAngle);
                // Shell body
                ctx.fillStyle = '#2E8B57';
                ctx.beginPath(); ctx.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2); ctx.fill();
                // Shell pattern
                ctx.fillStyle = '#1E6B3A';
                ctx.fillRect(-8, -4, 6, 8);
                ctx.fillRect(2, -4, 6, 8);
                // Shell highlight
                ctx.fillStyle = '#3CB371';
                ctx.fillRect(-6, -8, 4, 4);
                ctx.fillRect(4, -8, 4, 4);
                // Shell border
                ctx.strokeStyle = '#1a5a30';
                ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.lineWidth = 1;
                ctx.restore();
                // Rat tail sticking out
                const tw = Math.sin(e.frame * 4) * 3;
                ctx.fillStyle = '#CD853F';
                ctx.fillRect(ex - 4, ey + e.h / 2 - 1 + tw, 8, 3);
                ctx.fillRect(ex - 7, ey + e.h / 2 + tw, 4, 2);
            } else {
                // Upright walking ratter
                const walk = Math.sin(e.frame * 5) * 2;
                const dir = e.vx >= 0 ? 1 : -1;
                const fx = dir === 1 ? ex : ex; // face direction

                // Green shell (back)
                ctx.fillStyle = '#2E8B57';
                ctx.beginPath();
                ctx.ellipse(fx + 16, ey + 18, 12, 14, 0, 0, Math.PI * 2);
                ctx.fill();
                // Shell pattern
                ctx.fillStyle = '#1E6B3A';
                ctx.fillRect(fx + 10, ey + 12, 5, 10);
                ctx.fillRect(fx + 17, ey + 12, 5, 10);
                // Shell highlight
                ctx.fillStyle = '#3CB371';
                ctx.fillRect(fx + 12, ey + 8, 3, 4);
                ctx.fillRect(fx + 19, ey + 8, 3, 4);
                // Shell border
                ctx.strokeStyle = '#1a5a30';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(fx + 16, ey + 18, 12, 14, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.lineWidth = 1;

                // Body/belly (tan)
                ctx.fillStyle = '#DEB887';
                ctx.fillRect(fx + 10, ey + 14, 10, 14);

                // Head
                ctx.fillStyle = '#CD853F';
                ctx.fillRect(fx + 8 + dir * 6, ey + 2, 14, 14);
                // Snout
                ctx.fillStyle = '#DEB887';
                ctx.fillRect(fx + 10 + dir * 8, ey + 8, 8, 6);
                // Nose
                ctx.fillStyle = '#FF6B8A';
                ctx.fillRect(fx + 14 + dir * 8, ey + 9, 3, 3);
                // Eyes
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(fx + 12 + dir * 4, ey + 5, 3, 3);
                // Ear
                ctx.fillStyle = '#B8734A';
                ctx.fillRect(fx + 10, ey - 2, 5, 6);
                ctx.fillRect(fx + 18, ey - 2, 5, 6);
                // Inner ear
                ctx.fillStyle = '#FF8FAB';
                ctx.fillRect(fx + 11, ey - 1, 3, 4);
                ctx.fillRect(fx + 19, ey - 1, 3, 4);
                // Whiskers
                ctx.strokeStyle = '#999';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(fx + 14 + dir * 10, ey + 10);
                ctx.lineTo(fx + 14 + dir * 18, ey + 8);
                ctx.moveTo(fx + 14 + dir * 10, ey + 12);
                ctx.lineTo(fx + 14 + dir * 18, ey + 14);
                ctx.stroke();
                ctx.lineWidth = 1;

                // Feet (orange, walking animation)
                ctx.fillStyle = '#E8941E';
                ctx.fillRect(fx + 8, ey + 28, 6, 4 + walk);
                ctx.fillRect(fx + 18, ey + 28, 6, 4 - walk);
                // Toe claws
                ctx.fillStyle = '#FFF';
                ctx.fillRect(fx + 7, ey + 31 + walk, 3, 2);
                ctx.fillRect(fx + 17, ey + 31 - walk, 3, 2);

                // Tail
                const tw = Math.sin(e.frame * 3) * 4;
                ctx.fillStyle = '#CD853F';
                ctx.fillRect(fx - 2, ey + 20 + tw, 6, 3);
                ctx.fillRect(fx - 6, ey + 18 + tw, 5, 3);
                ctx.fillRect(fx - 9, ey + 16 + tw, 4, 3);
            }
            return;
        }

        // === FLYING RATTER (winged Koopa-style rat) ===
        if (e.type === 'flyratter') {
            const walk = Math.sin(e.frame * 5) * 2;
            const dir = e.vx >= 0 ? 1 : -1;
            const fx = ex;

            // Wings (behind body)
            const wingFlap = Math.sin(e.frame * 12) * 0.6;
            ctx.fillStyle = '#FFFFFF';
            ctx.save();
            // Left wing
            ctx.translate(fx + 4, ey + 10);
            ctx.rotate(-0.8 + wingFlap);
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(-18, -8); ctx.lineTo(-14, 4); ctx.lineTo(-4, 6);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#EEEEFF';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(-12, -4); ctx.lineTo(-10, 2);
            ctx.closePath(); ctx.fill();
            ctx.restore();
            ctx.save();
            // Right wing
            ctx.fillStyle = '#FFFFFF';
            ctx.translate(fx + e.w - 4, ey + 10);
            ctx.rotate(0.8 - wingFlap);
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(18, -8); ctx.lineTo(14, 4); ctx.lineTo(4, 6);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#EEEEFF';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(12, -4); ctx.lineTo(10, 2);
            ctx.closePath(); ctx.fill();
            ctx.restore();

            // Green shell (back)
            ctx.fillStyle = '#2E8B57';
            ctx.beginPath(); ctx.ellipse(fx + 16, ey + 18, 12, 14, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1E6B3A';
            ctx.fillRect(fx + 10, ey + 12, 5, 10);
            ctx.fillRect(fx + 17, ey + 12, 5, 10);
            ctx.fillStyle = '#3CB371';
            ctx.fillRect(fx + 12, ey + 8, 3, 4);
            ctx.fillRect(fx + 19, ey + 8, 3, 4);
            ctx.strokeStyle = '#1a5a30'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.ellipse(fx + 16, ey + 18, 12, 14, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.lineWidth = 1;
            // Body/belly
            ctx.fillStyle = '#DEB887';
            ctx.fillRect(fx + 10, ey + 14, 10, 14);
            // Head
            ctx.fillStyle = '#CD853F';
            ctx.fillRect(fx + 8 + dir * 6, ey + 2, 14, 14);
            ctx.fillStyle = '#DEB887';
            ctx.fillRect(fx + 10 + dir * 8, ey + 8, 8, 6);
            ctx.fillStyle = '#FF6B8A';
            ctx.fillRect(fx + 14 + dir * 8, ey + 9, 3, 3);
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(fx + 12 + dir * 4, ey + 5, 3, 3);
            // Ears
            ctx.fillStyle = '#B8734A';
            ctx.fillRect(fx + 10, ey - 2, 5, 6);
            ctx.fillRect(fx + 18, ey - 2, 5, 6);
            ctx.fillStyle = '#FF8FAB';
            ctx.fillRect(fx + 11, ey - 1, 3, 4);
            ctx.fillRect(fx + 19, ey - 1, 3, 4);
            // Feet (tucked up while flying)
            ctx.fillStyle = '#E8941E';
            ctx.fillRect(fx + 10, ey + 28, 5, 3);
            ctx.fillRect(fx + 18, ey + 28, 5, 3);
            // Tail
            const tw2 = Math.sin(e.frame * 3) * 4;
            ctx.fillStyle = '#CD853F';
            ctx.fillRect(fx - 2, ey + 20 + tw2, 6, 3);
            ctx.fillRect(fx - 6, ey + 18 + tw2, 5, 3);
            return;
        }

        // === RAT ARCHER ===
        if (e.type === 'archer') {
            const dir = e.dir || 1;
            const bobArm = Math.sin(e.frame * 3) * 1.5;
            // Body
            ctx.fillStyle = isCave ? '#3a3a3a' : '#6B4226';
            ctx.fillRect(ex + 6, ey + 8, 20, 18);
            ctx.fillStyle = isCave ? '#4a4a4a' : '#8B5A3C';
            ctx.fillRect(ex + 8, ey + 10, 16, 14);
            // Head
            ctx.fillStyle = isCave ? '#3a3a3a' : '#6B4226';
            ctx.fillRect(ex + 10 + dir * 4, ey + 2, 12, 12);
            // Snout
            ctx.fillStyle = isCave ? '#555' : '#A07050';
            ctx.fillRect(ex + 12 + dir * 8, ey + 6, 6, 5);
            // Nose
            ctx.fillStyle = '#FF6B8A';
            ctx.fillRect(ex + 14 + dir * 9, ey + 7, 3, 3);
            // Eyes
            ctx.fillStyle = isCave ? '#00FF66' : '#FF0000';
            ctx.fillRect(ex + 13 + dir * 5, ey + 5, 3, 3);
            // Ears
            ctx.fillStyle = isCave ? '#2a2a2a' : '#5A3418';
            ctx.fillRect(ex + 10, ey - 1, 4, 5);
            ctx.fillRect(ex + 18, ey - 1, 4, 5);
            ctx.fillStyle = '#FF8FAB';
            ctx.fillRect(ex + 11, ey, 2, 3);
            ctx.fillRect(ex + 19, ey, 2, 3);
            // Legs
            ctx.fillStyle = isCave ? '#2a2a2a' : '#5A3418';
            ctx.fillRect(ex + 10, ey + 26, 4, 5);
            ctx.fillRect(ex + 18, ey + 26, 4, 5);
            // Tail
            const tw = Math.sin(e.frame * 3) * 3;
            ctx.fillStyle = isCave ? '#2a2a2a' : '#5A3418';
            ctx.fillRect(ex + (dir === 1 ? -2 : 26), ey + 16 + tw, 6, 2);
            // Bow (arc on the side they're facing)
            ctx.save();
            ctx.translate(ex + 16 + dir * 12, ey + 14 + bobArm);
            ctx.strokeStyle = '#A0522D';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 10, -Math.PI * 0.6, Math.PI * 0.6, dir === -1);
            ctx.stroke();
            // Bowstring
            ctx.strokeStyle = '#DDD';
            ctx.lineWidth = 1;
            ctx.beginPath();
            const bx1 = 10 * Math.cos(-Math.PI * 0.6);
            const by1 = 10 * Math.sin(-Math.PI * 0.6);
            const bx2 = 10 * Math.cos(Math.PI * 0.6);
            const by2 = 10 * Math.sin(Math.PI * 0.6);
            if (dir === -1) {
                ctx.moveTo(-bx1, by1); ctx.lineTo(-bx2, by2);
            } else {
                ctx.moveTo(bx1, by1); ctx.lineTo(bx2, by2);
            }
            ctx.stroke();
            // Arrow nocked
            if (e.shootTimer < 30) {
                ctx.fillStyle = '#8B6914';
                ctx.fillRect(dir === 1 ? -2 : -10, -1, 12, 2);
                ctx.fillStyle = '#555';
                ctx.beginPath();
                ctx.moveTo(dir === 1 ? 10 : -10, 0);
                ctx.lineTo(dir === 1 ? 7 : -7, -2);
                ctx.lineTo(dir === 1 ? 7 : -7, 2);
                ctx.closePath(); ctx.fill();
            }
            ctx.restore();
            ctx.lineWidth = 1;
            // Glowing eye effect for cave
            if (isCave) {
                ctx.globalAlpha = 0.3; ctx.fillStyle = '#00FF66';
                ctx.beginPath(); ctx.arc(ex + 14.5 + dir * 5, ey + 6.5, 5, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
            }
            // Bandana / headband
            ctx.fillStyle = '#CC2222';
            ctx.fillRect(ex + 9 + dir * 4, ey + 1, 14, 3);
            // Bandana tail
            ctx.fillRect(ex + (dir === 1 ? 8 : 20), ey + 2, 3, 5);
            return;
        }

        // Rat body (darker for cave rats)
        ctx.fillStyle = isCave ? '#3a3a3a' : '#8B4513'; ctx.fillRect(ex + 4, ey + 8, 24, 18);
        ctx.fillStyle = isCave ? '#4a4a4a' : '#A0522D'; ctx.fillRect(ex + 6, ey + 10, 20, 14);
        // Head
        ctx.fillStyle = isCave ? '#3a3a3a' : '#8B4513'; ctx.fillRect(ex + 20, ey + 4, 10, 14);
        // Ears
        ctx.fillStyle = isCave ? '#2a2a2a' : '#6B3410'; ctx.fillRect(ex + 22, ey, 4, 6); ctx.fillRect(ex + 28, ey, 4, 6);
        // Eyes (glowing green for cave rats)
        ctx.fillStyle = isCave ? '#00FF66' : '#FF0000'; ctx.fillRect(ex + 24, ey + 8, 3, 3);
        if (isCave) {
            // Glowing eye effect
            ctx.globalAlpha = 0.3; ctx.fillStyle = '#00FF66';
            ctx.beginPath(); ctx.arc(ex + 25.5, ey + 9.5, 5, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        }
        // Tail
        const tw2 = Math.sin(e.frame * 3) * 3;
        ctx.fillStyle = isCave ? '#2a2a2a' : '#6B3410'; ctx.fillRect(ex - 2, ey + 14 + tw2, 8, 3);
        if (isCave) {
            // Luminous tail tip
            ctx.fillStyle = '#00FF66'; ctx.fillRect(ex - 4, ey + 13 + tw2, 3, 3);
        }
        // Legs
        const ll = Math.sin(e.frame * 5) * 2;
        ctx.fillStyle = isCave ? '#2a2a2a' : '#6B3410';
        ctx.fillRect(ex + 8, ey + 26, 4, 4 + ll); ctx.fillRect(ex + 18, ey + 26, 4, 4 - ll);

        // Pirate rat accessories on sky levels only
        if (isSky) {
            ctx.fillStyle = '#CC1111';
            ctx.fillRect(ex + 20, ey + 1, 12, 4);
            ctx.fillRect(ex + 20, ey + 3, 14, 2);
            ctx.fillRect(ex + 32, ey + 3, 6, 2);
            ctx.fillRect(ex + 34, ey + 5, 4, 2);
            ctx.fillStyle = '#111';
            ctx.fillRect(ex + 23, ey + 7, 5, 5);
            ctx.fillRect(ex + 22, ey + 4, 1, 5);
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(ex + 2, ey + 20, 3, 10);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(ex + 1, ey + 19, 5, 3);
        }
    }

    function drawCoin(cn) {
        if (cn.collected) return;
        const cx2 = Math.round(cn.x - cam.x), cy2 = Math.round(cn.y);
        if (cx2 < -20 || cx2 > W + 20) return;
        const stretch = Math.abs(Math.cos(cn.anim));
        const w = cn.w * stretch;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.ellipse(cx2 + cn.w / 2, cy2 + cn.h / 2, Math.max(w / 2, 2), cn.h / 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath(); ctx.ellipse(cx2 + cn.w / 2, cy2 + cn.h / 2, Math.max(w / 3, 1), cn.h / 3, 0, 0, Math.PI * 2); ctx.fill();
    }

    function drawShipDecorations() {
        if (!level) return;
        const startC = Math.max(0, Math.floor(cam.x / T) - 2);
        const endC = Math.min(level.cols, startC + COLS + 4);
        // Find ship top-rows: horizontal runs of B-blocks (type 2) with air above
        let shipTops = [];
        for (let r = 0; r < level.rows; r++) {
            let runStart = -1;
            for (let c = startC; c <= endC; c++) {
                if (c < level.cols && level.grid[r][c] === 2 && (r === 0 || level.grid[r - 1][c] !== 2)) {
                    if (runStart === -1) runStart = c;
                } else {
                    if (runStart !== -1 && c - runStart >= 3) {
                        shipTops.push({ r: r, c1: runStart, c2: c - 1 });
                    }
                    runStart = -1;
                }
            }
            if (runStart !== -1 && endC - runStart >= 3) {
                shipTops.push({ r: r, c1: runStart, c2: endC - 1 });
            }
        }

        for (const ship of shipTops) {
            const shipW = (ship.c2 - ship.c1 + 1) * T;
            const leftX = ship.c1 * T - cam.x;
            const rightX = (ship.c2 + 1) * T - cam.x;
            const midX = (leftX + rightX) / 2;
            const topY = ship.r * T;

            // === BALLOON / ENVELOPE ===
            const balloonW = shipW * 0.9;
            const balloonH = 50;
            const balloonY = topY - 70;
            const breathe = Math.sin(frameCount * 0.02 + ship.c1) * 2;

            // Balloon body (cream/tan)
            ctx.fillStyle = '#F5E6C8';
            ctx.beginPath();
            ctx.ellipse(midX, balloonY + breathe, balloonW / 2, balloonH / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Balloon highlight (lighter top)
            ctx.fillStyle = '#FFF8EC';
            ctx.beginPath();
            ctx.ellipse(midX, balloonY - 8 + breathe, balloonW / 2 - 6, balloonH / 2 - 12, 0, Math.PI, 0);
            ctx.fill();

            // Balloon bottom shadow
            ctx.fillStyle = '#D4B896';
            ctx.beginPath();
            ctx.ellipse(midX, balloonY + 10 + breathe, balloonW / 2 - 4, balloonH / 2 - 14, 0, 0, Math.PI);
            ctx.fill();

            // Brown rib lines on balloon
            ctx.strokeStyle = '#8B6B4A';
            ctx.lineWidth = 1.5;
            const ribCount = Math.max(4, Math.floor(shipW / 30));
            for (let i = 0; i < ribCount; i++) {
                const ribX = midX - balloonW / 2 + (balloonW / (ribCount + 1)) * (i + 1);
                ctx.beginPath();
                ctx.moveTo(ribX, balloonY - balloonH / 2 + 6 + breathe);
                ctx.lineTo(ribX, balloonY + balloonH / 2 - 6 + breathe);
                ctx.stroke();
            }

            // Brown band across middle of balloon
            ctx.fillStyle = '#8B6B4A';
            ctx.fillRect(midX - balloonW / 2 + 8, balloonY - 4 + breathe, balloonW - 16, 8);

            // === RIGGING / ROPES ===
            ctx.strokeStyle = '#6B5030';
            ctx.lineWidth = 1.5;
            // Left ropes
            ctx.beginPath();
            ctx.moveTo(midX - balloonW / 2 + 10, balloonY + balloonH / 2 - 4 + breathe);
            ctx.lineTo(leftX + 6, topY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(midX - balloonW / 3, balloonY + balloonH / 2 - 2 + breathe);
            ctx.lineTo(leftX + shipW * 0.25, topY);
            ctx.stroke();
            // Right ropes
            ctx.beginPath();
            ctx.moveTo(midX + balloonW / 2 - 10, balloonY + balloonH / 2 - 4 + breathe);
            ctx.lineTo(rightX - 6, topY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(midX + balloonW / 3, balloonY + balloonH / 2 - 2 + breathe);
            ctx.lineTo(rightX - shipW * 0.25, topY);
            ctx.stroke();

            // === CHIMNEY / SMOKESTACK ===
            ctx.fillStyle = '#777';
            ctx.fillRect(midX - 4, balloonY - balloonH / 2 - 10 + breathe, 8, 14);
            ctx.fillStyle = '#999';
            ctx.fillRect(midX - 5, balloonY - balloonH / 2 - 12 + breathe, 10, 4);

            // === GOLD BOW FIN (front/left) ===
            ctx.fillStyle = '#DAA520';
            ctx.beginPath();
            ctx.moveTo(leftX, topY + T / 2);
            ctx.lineTo(leftX - 20, topY + T * 0.3);
            ctx.lineTo(leftX - 12, topY + T);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#C49310';
            ctx.beginPath();
            ctx.moveTo(leftX - 20, topY + T * 0.3);
            ctx.lineTo(leftX - 28, topY + T * 0.15);
            ctx.lineTo(leftX - 20, topY + T * 0.6);
            ctx.closePath();
            ctx.fill();

            // === GOLD STERN FIN (back/right) ===
            ctx.fillStyle = '#DAA520';
            ctx.beginPath();
            ctx.moveTo(rightX, topY + T / 2);
            ctx.lineTo(rightX + 16, topY + T * 0.2);
            ctx.lineTo(rightX + 10, topY + T);
            ctx.closePath();
            ctx.fill();
            // Tail fin
            ctx.fillStyle = '#B8860B';
            ctx.beginPath();
            ctx.moveTo(rightX + 16, topY + T * 0.2);
            ctx.lineTo(rightX + 28, topY - 6);
            ctx.lineTo(rightX + 26, topY + T * 0.5);
            ctx.closePath();
            ctx.fill();

            // === PORTHOLE WINDOWS ===
            const windowCount = Math.max(2, Math.floor(shipW / 50));
            const windowSpacing = shipW / (windowCount + 1);
            for (let i = 0; i < windowCount; i++) {
                const wx = leftX + windowSpacing * (i + 1);
                const wy = topY + T * 0.5;
                // Window frame (dark brown)
                ctx.fillStyle = '#3A2A1A';
                ctx.beginPath();
                ctx.arc(wx, wy, 6, 0, Math.PI * 2);
                ctx.fill();
                // Window glass (light blue)
                ctx.fillStyle = '#8EC8E8';
                ctx.beginPath();
                ctx.arc(wx, wy, 4, 0, Math.PI * 2);
                ctx.fill();
                // Window shine
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.fillRect(wx - 2, wy - 3, 2, 2);
            }

            // === PROPELLER (back) ===
            const propX = rightX + 22;
            const propY = topY + T;
            const spin = frameCount * 0.15 + ship.c1;
            // Propeller hub
            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.arc(propX, propY, 4, 0, Math.PI * 2);
            ctx.fill();
            // Propeller blades (spinning)
            ctx.fillStyle = '#DAA520';
            ctx.save();
            ctx.translate(propX, propY);
            for (let b = 0; b < 3; b++) {
                ctx.save();
                ctx.rotate(spin + b * Math.PI * 2 / 3);
                ctx.fillRect(-2, -18, 4, 18);
                ctx.restore();
            }
            ctx.restore();

            // === HULL KEEL LINE ===
            // Find hull bottom
            let hullBottom = ship.r;
            for (let checkR = ship.r; checkR < level.rows; checkR++) {
                if (level.grid[checkR] && level.grid[checkR][ship.c1] === 2) hullBottom = checkR;
                else break;
            }
            const keelY = (hullBottom + 1) * T;
            // Curved keel
            ctx.fillStyle = '#5C3317';
            ctx.beginPath();
            ctx.moveTo(leftX, keelY);
            ctx.quadraticCurveTo(midX, keelY + 14, rightX, keelY);
            ctx.lineTo(rightX, keelY - 2);
            ctx.quadraticCurveTo(midX, keelY + 10, leftX, keelY - 2);
            ctx.closePath();
            ctx.fill();
        }
    }

    function drawSkyIslandBackground() {
        // Bright high-altitude sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#1a1a6e');
        grad.addColorStop(0.25, '#4A6FD9');
        grad.addColorStop(0.5, '#68B8E8');
        grad.addColorStop(0.8, '#A8DFFF');
        grad.addColorStop(1, '#FFE8C0');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

        // Distant floating islands (parallax far)
        const ip = -cam.x * 0.05;
        ctx.fillStyle = '#6080B0';
        [[200, 160, 80, 25], [500, 130, 100, 30], [900, 170, 70, 20], [1300, 140, 90, 28]].forEach(([ix, iy, iw, ih]) => {
            const x = (ix + ip) % 1600 - 200;
            // Island body
            ctx.beginPath(); ctx.ellipse(x, iy, iw, ih, 0, Math.PI, 0); ctx.fill();
            ctx.fillRect(x - iw, iy, iw * 2, 4);
            // Waterfall
            ctx.fillStyle = 'rgba(120,200,255,0.3)';
            ctx.fillRect(x - 2, iy + 4, 4, H - iy);
            ctx.fillStyle = '#6080B0';
        });

        // Big fluffy clouds (parallax medium)
        const co = -cam.x * 0.12;
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        [[80, 50, 70], [350, 80, 55], [600, 35, 80], [850, 65, 60], [1100, 45, 65]].forEach(([bx, by, bw]) => {
            const x2 = (bx + co) % 1400 - 150;
            ctx.beginPath(); ctx.ellipse(x2, by, bw, bw * 0.4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(x2 - bw * 0.5, by + 8, bw * 0.6, bw * 0.35, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(x2 + bw * 0.5, by + 6, bw * 0.7, bw * 0.4, 0, 0, Math.PI * 2); ctx.fill();
        });

        // Rainbow arc (subtle)
        ctx.globalAlpha = 0.12;
        ctx.lineWidth = 8;
        const colors = ['#FF0000', '#FF8800', '#FFFF00', '#00FF00', '#0088FF', '#8800FF'];
        colors.forEach((c, i) => {
            ctx.strokeStyle = c;
            ctx.beginPath();
            ctx.arc(W / 2, H + 100, 350 - i * 10, Math.PI * 1.15, Math.PI * 1.85);
            ctx.stroke();
        });
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;

        // Sparkle particles
        if (frameCount % 8 === 0) {
            const px = Math.random() * W + cam.x;
            const py = Math.random() * H * 0.6;
            addParticle(px, py, Math.random() > 0.5 ? '#FFFFAA' : '#AAEEFF', 1.5, 2);
        }
    }

    function drawCaveBackground() {
        // Dark cave background
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#1a1a1a'); grad.addColorStop(0.5, '#2a1a0e'); grad.addColorStop(1, '#0d0d0d');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
        // Stalactites on ceiling
        const co = -cam.x * 0.05;
        for (let i = 0; i < 20; i++) {
            const sx = (i * 90 + co) % (1800) - 100;
            const sh = 15 + Math.sin(i * 2.3) * 10;
            ctx.fillStyle = '#3a3a3a';
            ctx.beginPath();
            ctx.moveTo(sx, 0); ctx.lineTo(sx + 8, 0); ctx.lineTo(sx + 4, sh);
            ctx.closePath(); ctx.fill();
        }
        // Glowing crystals on walls
        const pulse = Math.sin(frameCount * 0.03) * 0.3 + 0.7;
        for (let i = 0; i < 8; i++) {
            const cx = (i * 180 + co * 0.3) % 1600 - 50;
            const cy = 60 + Math.sin(i * 3.7) * 40;
            ctx.globalAlpha = pulse * 0.4;
            ctx.fillStyle = i % 3 === 0 ? '#FF4400' : i % 3 === 1 ? '#00FFCC' : '#AA66FF';
            ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
            // Glow
            ctx.globalAlpha = pulse * 0.1;
            ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Lava glow at bottom
        const lavaGlow = 0.15 + Math.sin(frameCount * 0.02) * 0.05;
        ctx.globalAlpha = lavaGlow;
        ctx.fillStyle = '#FF4400';
        ctx.fillRect(0, H - 60, W, 60);
        ctx.globalAlpha = 1;
    }

    function drawBackground() {
        if (currentLevel >= 11) { drawCaveBackground(); return; }
        if (currentLevel >= 5) { drawSkyIslandBackground(); return; }
        if (currentLevel >= 3) { drawCastleBackground(); return; }
        // Sky
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#4A90D9'); grad.addColorStop(0.6, '#87CEEB'); grad.addColorStop(1, '#B8E6B8');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
        // Clouds
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        const co = -cam.x * 0.1;
        [[100, 40, 60], [300, 60, 50], [550, 30, 70], [750, 55, 45], [950, 35, 55]].forEach(([bx, by, bw]) => {
            const x2 = (bx + co) % 1200 - 100;
            ctx.beginPath(); ctx.ellipse(x2, by, bw, bw * 0.4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(x2 - bw * 0.4, by + 5, bw * 0.5, bw * 0.3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(x2 + bw * 0.4, by + 5, bw * 0.6, bw * 0.35, 0, 0, Math.PI * 2); ctx.fill();
        });
        // Hills (parallax)
        ctx.fillStyle = '#5BAA5B';
        const ho = -cam.x * 0.2;
        for (let i = 0; i < 8; i++) {
            const hx = (i * 200 + ho) % (1600) - 200;
            const hh = 40 + Math.sin(i * 1.3) * 20;
            ctx.beginPath(); ctx.ellipse(hx + 80, H - 60 + 10, 120, hh, 0, Math.PI, 0); ctx.fill();
        }
        ctx.fillStyle = '#4A9A4A';
        for (let i = 0; i < 10; i++) {
            const hx = (i * 160 + ho * 1.4) % (1600) - 160;
            ctx.beginPath(); ctx.ellipse(hx + 60, H - 60 + 15, 80, 30 + Math.sin(i * 2.1) * 10, 0, Math.PI, 0); ctx.fill();
        }
    }

    function drawCastleBackground() {
        // Dark stone interior
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0A0A12'); grad.addColorStop(0.4, '#141420'); grad.addColorStop(1, '#1A1A28');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

        // Stone texture on back wall (subtle)
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#445';
        for (let r = 0; r < H / 32; r++) {
            for (let c = 0; c < W / 32 + 1; c++) {
                const bx = c * 32 - (cam.x * 0.05 % 32), by = r * 32;
                ctx.fillRect(bx, by, 31, 15);
                ctx.fillRect(bx + 16, by + 16, 31, 15);
            }
        }
        ctx.globalAlpha = 1;

        // Red carpet on the floor
        const carpetY = 10 * T;  // row 10 is above the floor
        const cx1 = 3 * T - cam.x, cx2 = 47 * T - cam.x;
        if (cx2 > 0 && cx1 < W) {
            ctx.fillStyle = '#8B1A1A';
            ctx.fillRect(Math.max(0, cx1), carpetY, cx2 - cx1, T);
            ctx.fillStyle = '#AA2222';
            ctx.fillRect(Math.max(0, cx1), carpetY + 4, cx2 - cx1, T - 8);
            // Gold trim
            ctx.fillStyle = '#DAA520';
            ctx.fillRect(Math.max(0, cx1), carpetY, cx2 - cx1, 2);
            ctx.fillRect(Math.max(0, cx1), carpetY + T - 2, cx2 - cx1, 2);
        }

        // Torches on walls (animated)
        const torchPositions = [4, 12, 20, 28, 36, 44];
        torchPositions.forEach((tc, idx) => {
            const tx = tc * T - cam.x;
            if (tx < -T || tx > W + T) return;
            const ty = 3 * T; // row 3 height on the wall

            // Torch bracket
            ctx.fillStyle = '#5C3A1E';
            ctx.fillRect(tx + 12, ty + 10, 8, 16);
            ctx.fillRect(tx + 8, ty + 6, 16, 6);

            // Flame (flickering)
            const flicker = Math.sin(frameCount * 0.15 + idx * 2) * 3;
            const flicker2 = Math.cos(frameCount * 0.2 + idx * 3) * 2;

            // Outer glow
            ctx.globalAlpha = 0.15 + Math.sin(frameCount * 0.1 + idx) * 0.05;
            ctx.fillStyle = '#FF4500';
            ctx.beginPath();
            ctx.arc(tx + 16, ty - 4, 28, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Flame body
            ctx.fillStyle = '#FF6600';
            ctx.beginPath();
            ctx.ellipse(tx + 16 + flicker2, ty, 7, 12 + flicker, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFAA00';
            ctx.beginPath();
            ctx.ellipse(tx + 16 + flicker2, ty + 2, 4, 8 + flicker * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFDD44';
            ctx.beginPath();
            ctx.ellipse(tx + 16, ty + 4, 2, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        // Banners
        const bannerCols = [8, 24, 40];
        bannerCols.forEach((bc, idx) => {
            const bx = bc * T - cam.x;
            if (bx < -T * 2 || bx > W + T * 2) return;
            const by = 1 * T;
            // Pole
            ctx.fillStyle = '#DAA520';
            ctx.fillRect(bx + 12, by, 8, 6);
            // Banner body
            const wave = Math.sin(frameCount * 0.03 + idx * 1.5) * 2;
            ctx.fillStyle = '#6B0000';
            ctx.fillRect(bx + 6, by + 6, 20, 48 + wave);
            ctx.fillStyle = '#8B0000';
            ctx.fillRect(bx + 8, by + 8, 16, 44 + wave);
            // Rat emblem (simple)
            ctx.fillStyle = '#DAA520';
            ctx.fillRect(bx + 12, by + 20, 8, 6);
            ctx.fillRect(bx + 14, by + 16, 4, 4);
            ctx.fillRect(bx + 14, by + 26, 4, 8);
        });

        // Ambient particles (dust in light)
        if (frameCount % 10 === 0) {
            const px = Math.random() * W + cam.x;
            const py = Math.random() * H * 0.7;
            addParticle(px, py, '#554433', 1, 1);
        }
    }

    // ---- VOID / ABYSS ----
    function findGroundRow() {
        // Find the topmost row that has ground in it (the "surface" row)
        if (!level) return LEVEL_H - 4;
        for (let r = 0; r < level.rows; r++) {
            for (let c = 0; c < level.cols; c++) {
                if (level.grid[r][c] === 1) return r;
            }
        }
        return level.rows - 4;
    }

    function spawnVoidParticles() {
        if (!level || state !== 'playing') return;
        const groundR = findGroundRow();
        const startC = Math.max(0, Math.floor(cam.x / T) - 2);
        const endC = Math.min(level.cols, startC + COLS + 4);
        // Find gap columns (air at ground level)
        for (let c = startC; c < endC; c++) {
            let isGap = true;
            for (let r = groundR; r < level.rows; r++) {
                if (level.grid[r] && level.grid[r][c] && level.grid[r][c] > 0) { isGap = false; break; }
            }
            if (isGap && Math.random() < 0.06) {
                voidParticles.push({
                    x: c * T + Math.random() * T,
                    y: level.rows * T + Math.random() * 40,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: -0.5 - Math.random() * 1.5,
                    life: 60 + Math.random() * 60,
                    maxLife: 120,
                    size: 2 + Math.random() * 4,
                    color: Math.random() < 0.5 ? '#8B00FF' : '#4B0082'
                });
            }
        }
    }

    function updateVoidParticles() {
        for (let i = voidParticles.length - 1; i >= 0; i--) {
            const p = voidParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx += (Math.random() - 0.5) * 0.1; // slight drift
            p.life--;
            if (p.life <= 0) voidParticles.splice(i, 1);
        }
    }

    function drawVoid() {
        if (!level) return;
        const groundR = findGroundRow();
        const startC = Math.max(0, Math.floor(cam.x / T) - 1);
        const endC = Math.min(level.cols, startC + COLS + 2);
        const pulse = 0.6 + Math.sin(frameCount * 0.03) * 0.15;

        for (let c = startC; c < endC; c++) {
            // Check if this column is a gap (no solid tiles from ground row down)
            let isGap = true;
            for (let r = groundR; r < level.rows; r++) {
                if (level.grid[r] && level.grid[r][c] !== undefined && level.grid[r][c] > 0) { isGap = false; break; }
            }
            if (!isGap) continue;

            const x = c * T - cam.x;
            const topY = groundR * T;

            // Dark void gradient going down
            const voidGrad = ctx.createLinearGradient(x, topY, x, H + 40);
            voidGrad.addColorStop(0, 'rgba(10, 0, 20, 0.3)');
            voidGrad.addColorStop(0.3, 'rgba(10, 0, 30, 0.7)');
            voidGrad.addColorStop(0.6, 'rgba(5, 0, 15, 0.9)');
            voidGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
            ctx.fillStyle = voidGrad;
            ctx.fillRect(x, topY, T, H - topY + 40);

            // Purple glow at the edges
            ctx.shadowColor = `rgba(139, 0, 255, ${pulse * 0.4})`;
            ctx.shadowBlur = 12;
            // Left edge glow line
            ctx.strokeStyle = `rgba(139, 0, 255, ${pulse * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x, topY); ctx.lineTo(x, H); ctx.stroke();
            // Right edge glow line
            ctx.beginPath(); ctx.moveTo(x + T, topY); ctx.lineTo(x + T, H); ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Draw void particles (rising wisps)
        for (const p of voidParticles) {
            const sx = p.x - cam.x;
            if (sx < -20 || sx > W + 20) continue;
            const a = (p.life / p.maxLife) * pulse;
            ctx.globalAlpha = a;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(sx, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            // Glow effect
            ctx.globalAlpha = a * 0.3;
            ctx.beginPath();
            ctx.arc(sx, p.y, p.size * 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function drawParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--;
            if (p.life <= 0) { particles.splice(i, 1); continue; }
            const a = p.life / p.maxLife;
            ctx.globalAlpha = a; ctx.fillStyle = p.color;
            ctx.fillRect(p.x - cam.x, p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }

    function drawQuestionHitAnim() {
        for (let i = questionHits.length - 1; i >= 0; i--) {
            const q = questionHits[i]; q.timer--;
            if (q.timer <= 0) { questionHits.splice(i, 1); continue; }
            // Bounce the tile up briefly
            const offset = -Math.sin(q.timer / 8 * Math.PI) * 6;
            const x = q.c * T - cam.x, y = q.r * T + offset;
            ctx.fillStyle = '#8B7355'; ctx.fillRect(x, y, T, T);
            ctx.fillStyle = '#6B5335'; ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
        }
    }

    // GAME FLOW
    function loadLevel(idx) {
        level = parseLevel(idx);
        cat.x = level.spawnX * T; cat.y = level.spawnY * T - cat.h;
        cat.vx = 0; cat.vy = 0; cat.grounded = false; cat.dead = false;
        cam.x = Math.max(0, cat.x - W / 3);
        particles = []; questionHits = []; invincibleTimer = 0; fireballs = []; arrows = []; activeCheckpoint = null; stars = []; powerUps = []; heldShell = null;
        isBig = false; cat.h = 32;
        // Reset P2
        if (coopMode) {
            cat2.x = level.spawnX * T + 30; cat2.y = level.spawnY * T - cat2.h;
            cat2.vx = 0; cat2.vy = 0; cat2.grounded = false; cat2.dead = false;
            isBig2 = false; cat2.h = 32; heldShell2 = null;
        }
        // Spawn boss on boss arena (index 4) or pirate boss (index 10)
        if (idx === 4 || idx === 10) {
            const isPirate = idx === 10;
            const raw = LEVEL_DATA[idx];
            for (let r = 0; r < raw.length; r++) {
                for (let c = 0; c < raw[r].length; c++) {
                    if (raw[r][c] === 'X') { boss = createBoss(c * T - 16, r * T - 64 + T, isPirate); }
                }
            }
        } else {
            boss = null;
        }
    }

    function startGame() {
        state = 'playing'; score = 0; lives = 3; coinCount = 0; currentLevel = 0; hasFire = false; fireCooldown = 0; fireballs = []; activeCheckpoint = null; speedBoost = 0; shieldHits = 0;
        inventory = [];
        cat2SelectedSkin = selectedSkin === 1 ? 0 : 1; // P2 uses different skin
        p1HP = 3; p2HP = 3;
        loadLevel(0); overlay.classList.remove('visible');
    }

    // ONLINE MULTIPLAYER — Lobby & Networking
    const lobbyOverlay = document.getElementById('lobby-overlay');
    const lobbyMenu = document.getElementById('lobby-menu');
    const lobbyWaiting = document.getElementById('lobby-waiting');
    const lobbyRoomCode = document.getElementById('lobby-room-code');
    const lobbyStatus = document.getElementById('lobby-status');
    const lobbyDot = document.getElementById('lobby-dot');
    const lobbyConnText = document.getElementById('lobby-connection-text');
    const joinCodeInput = document.getElementById('join-code-input');
    const lobbyApproval = document.getElementById('lobby-approval');
    const lobbyModeBadge = document.getElementById('lobby-room-mode-badge');
    const roomModeDesc = document.getElementById('room-mode-desc');
    let roomIsPublic = false; // false = private, true = public

    // Room mode toggle
    window._setRoomMode = function (isPublic) {
        roomIsPublic = isPublic;
        const btnPrivate = document.getElementById('btn-mode-private');
        const btnPublic = document.getElementById('btn-mode-public');
        if (isPublic) {
            btnPublic.classList.add('mode-btn-active');
            btnPrivate.classList.remove('mode-btn-active');
            roomModeDesc.textContent = 'Code required, host approves join';
        } else {
            btnPrivate.classList.add('mode-btn-active');
            btnPublic.classList.remove('mode-btn-active');
            roomModeDesc.textContent = 'Code required, auto-join';
        }
    };

    function openLobby() {
        state = 'lobby';
        overlay.classList.remove('visible');
        lobbyOverlay.classList.remove('hidden');
        lobbyMenu.style.display = '';
        lobbyWaiting.classList.add('hidden');
        if (lobbyApproval) lobbyApproval.classList.add('hidden');
        lobbyStatus.textContent = '';
        if (joinCodeInput) joinCodeInput.value = '';
        // Reset toggle to private
        window._setRoomMode(false);
    }

    function closeLobby() {
        lobbyOverlay.classList.add('hidden');
        if (lobbyApproval) lobbyApproval.classList.add('hidden');
        NetworkManager.disconnect();
        onlineMode = false; isOnlineHost = false; isOnlineGuest = false;
        state = 'start';
        showOverlay('SUPER CAT WORLD', 'PRESS SPACE TO START\nPRESS 2 FOR CO-OP\nPRESS 3 FOR ONLINE');
    }

    function startOnlineGame() {
        coopMode = true;
        onlineMode = true;
        cat2SelectedSkin = selectedSkin === 1 ? 0 : 1;
        p1HP = 3; p2HP = 3;
        lobbyOverlay.classList.add('hidden');
        if (lobbyApproval) lobbyApproval.classList.add('hidden');
        state = 'playing'; score = 0; lives = 3; coinCount = 0; currentLevel = 0;
        hasFire = false; fireCooldown = 0; fireballs = []; activeCheckpoint = null;
        speedBoost = 0; shieldHits = 0; inventory = [];
        loadLevel(0); overlay.classList.remove('visible');
    }

    // Approval callbacks (public rooms)
    window._approveJoin = function () {
        if (lobbyApproval) lobbyApproval.classList.add('hidden');
        NetworkManager.acceptPending();
        // onConnect will fire after acceptance, which starts the game
    };

    window._denyJoin = function () {
        if (lobbyApproval) lobbyApproval.classList.add('hidden');
        NetworkManager.denyPending();
        lobbyConnText.textContent = 'Request denied. Waiting for player...';
        lobbyDot.classList.remove('connected');
    };

    // Lobby button callbacks (exposed on window for onclick)
    window._lobbyHost = async function () {
        lobbyStatus.textContent = '';
        lobbyMenu.style.display = 'none';
        lobbyWaiting.classList.remove('hidden');
        lobbyConnText.textContent = 'Creating room...';
        lobbyDot.classList.remove('connected');
        if (lobbyApproval) lobbyApproval.classList.add('hidden');
        try {
            const code = await NetworkManager.host({
                onConnect: () => {
                    lobbyDot.classList.add('connected');
                    lobbyConnText.textContent = 'Player joined! Starting...';
                    isOnlineHost = true;
                    isOnlineGuest = false;
                    if (lobbyApproval) lobbyApproval.classList.add('hidden');
                    setTimeout(() => {
                        NetworkManager.send({ type: 'start' });
                        startOnlineGame();
                    }, 1000);
                },
                onDisconnect: () => {
                    if (state === 'playing') {
                        netDisconnectMsg = 'PARTNER DISCONNECTED';
                        netDisconnectTimer = 180;
                        onlineMode = false; isOnlineHost = false;
                    }
                },
                onData: (data) => {
                    // Host receives guest inputs
                    if (data && data.type === 'input') {
                        remoteInputs = data.keys;
                    }
                },
                onConnectionRequest: (peerId) => {
                    // Public mode: show approval dialog
                    lobbyConnText.textContent = 'Join request received!';
                    if (lobbyApproval) lobbyApproval.classList.remove('hidden');
                },
                onError: (err) => {
                    lobbyStatus.textContent = 'Error: ' + (err.message || err.type);
                }
            }, roomIsPublic);
            lobbyRoomCode.textContent = code;
            lobbyConnText.textContent = 'Waiting for player...';
            // Show mode badge
            if (lobbyModeBadge) {
                if (roomIsPublic) {
                    lobbyModeBadge.textContent = '🌍 PUBLIC — You approve joins';
                    lobbyModeBadge.style.color = '#FFD700';
                    lobbyModeBadge.style.background = 'rgba(255,215,0,0.1)';
                } else {
                    lobbyModeBadge.textContent = '🔒 PRIVATE — Auto-join';
                    lobbyModeBadge.style.color = '#00FF88';
                    lobbyModeBadge.style.background = 'rgba(0,255,136,0.1)';
                }
            }
            // Click to copy
            lobbyRoomCode.onclick = () => {
                navigator.clipboard.writeText(code).then(() => {
                    lobbyConnText.textContent = 'Code copied!';
                    setTimeout(() => { lobbyConnText.textContent = 'Waiting for player...'; }, 1500);
                }).catch(() => {});
            };
        } catch (err) {
            lobbyStatus.textContent = 'Failed to host: ' + (err.message || err.type);
            lobbyMenu.style.display = '';
            lobbyWaiting.classList.add('hidden');
        }
    };

    window._lobbyJoin = async function () {
        const code = joinCodeInput ? joinCodeInput.value.trim() : '';
        if (code.length !== 4) {
            lobbyStatus.textContent = 'Enter a 4-character room code';
            return;
        }
        lobbyStatus.textContent = '';
        lobbyMenu.style.display = 'none';
        lobbyWaiting.classList.remove('hidden');
        lobbyRoomCode.textContent = code.toUpperCase();
        lobbyConnText.textContent = 'Connecting...';
        lobbyDot.classList.remove('connected');
        try {
            await NetworkManager.join(code, {
                onConnect: () => {
                    lobbyDot.classList.add('connected');
                    lobbyConnText.textContent = 'Connected! Waiting for host...';
                    isOnlineGuest = true;
                    isOnlineHost = false;
                },
                onDisconnect: () => {
                    if (state === 'playing') {
                        netDisconnectMsg = 'HOST DISCONNECTED';
                        netDisconnectTimer = 180;
                        onlineMode = false; isOnlineGuest = false;
                    }
                },
                onData: (data) => {
                    // Guest receives game state from host
                    if (data && data.type === 'state') {
                        applyHostState(data);
                    }
                    if (data && data.type === 'start') {
                        // Host tells guest to start the game
                        startOnlineGame();
                    }
                },
                onError: (err) => {
                    lobbyStatus.textContent = 'Error: ' + (err.message || err.type);
                }
            });
        } catch (err) {
            lobbyStatus.textContent = 'Failed to join: ' + (err.message || err.type);
            lobbyMenu.style.display = '';
            lobbyWaiting.classList.add('hidden');
        }
    };

    window._lobbyBack = function () {
        closeLobby();
    };

    // Apply host state on guest side
    function applyHostState(data) {
        if (!level && data.level !== undefined) {
            currentLevel = data.level;
            loadLevel(currentLevel);
        }
        if (data.level !== undefined && data.level !== currentLevel) {
            currentLevel = data.level;
            loadLevel(currentLevel);
        }
        // Apply cat positions
        if (data.cat) {
            cat.x = data.cat.x; cat.y = data.cat.y;
            cat.vx = data.cat.vx; cat.vy = data.cat.vy;
            cat.dir = data.cat.dir; cat.grounded = data.cat.grounded;
            cat.dead = data.cat.dead; cat.h = data.cat.h;
        }
        if (data.cat2) {
            cat2.x = data.cat2.x; cat2.y = data.cat2.y;
            cat2.vx = data.cat2.vx; cat2.vy = data.cat2.vy;
            cat2.dir = data.cat2.dir; cat2.grounded = data.cat2.grounded;
            cat2.dead = data.cat2.dead; cat2.h = data.cat2.h;
        }
        if (data.cam !== undefined) cam.x = data.cam;
        if (data.score !== undefined) score = data.score;
        if (data.coinCount !== undefined) coinCount = data.coinCount;
        if (data.lives !== undefined) lives = data.lives;
        if (data.p1HP !== undefined) p1HP = data.p1HP;
        if (data.p2HP !== undefined) p2HP = data.p2HP;
        if (data.hasFire !== undefined) hasFire = data.hasFire;
        if (data.state) state = data.state;
        if (data.shakeTimer) { shakeTimer = data.shakeTimer; shakeAmt = data.shakeAmt || 3; }
        // Sync enemy alive states
        if (data.enemies && level) {
            for (let i = 0; i < Math.min(data.enemies.length, level.enemies.length); i++) {
                level.enemies[i].x = data.enemies[i].x;
                level.enemies[i].y = data.enemies[i].y;
                level.enemies[i].alive = data.enemies[i].alive;
                level.enemies[i].vx = data.enemies[i].vx;
                if (data.enemies[i].shell !== undefined) level.enemies[i].shell = data.enemies[i].shell;
            }
        }
        // Sync coins
        if (data.coins && level) {
            for (let i = 0; i < Math.min(data.coins.length, level.coins.length); i++) {
                level.coins[i].collected = data.coins[i];
            }
        }
        // Sync fireballs count (just show particles on guest)
        if (data.fireballs !== undefined && level) {
            // Sync fireball positions for rendering
            fireballs = data.fireballs.map(fb => ({ x: fb.x, y: fb.y, w: 10, h: 10, vx: fb.vx, vy: fb.vy, life: fb.life, trail: [] }));
        }
        // Boss
        if (data.boss) {
            if (!boss) boss = createBoss(data.boss.x, data.boss.y, data.boss.pirate);
            boss.x = data.boss.x; boss.y = data.boss.y;
            boss.hp = data.boss.hp; boss.alive = data.boss.alive;
            boss.dir = data.boss.dir; boss.phase = data.boss.phase;
        } else { boss = null; }
        // Grid changes (question blocks hit)
        if (data.gridChanges && level) {
            data.gridChanges.forEach(gc => {
                if (level.grid[gc.r] && level.grid[gc.r][gc.c] !== undefined) {
                    level.grid[gc.r][gc.c] = gc.v;
                }
            });
        }
    }

    // Network sync in game loop (called from update)
    function networkSync() {
        if (!onlineMode || !NetworkManager.isConnected) return;
        netSendTimer++;
        if (netSendTimer < NET_SEND_INTERVAL) return;
        netSendTimer = 0;

        if (isOnlineHost) {
            // Apply remote inputs to keys2
            keys2.left = remoteInputs.left;
            keys2.right = remoteInputs.right;
            keys2.jump = remoteInputs.jump;
            if (remoteInputs.jumpPressed) {
                keys2.jumpPressed = true;
                remoteInputs.jumpPressed = false;
            }
            keys2.glide = remoteInputs.glide;
            // Handle remote scratch
            if (remoteInputs.scratch && cat2ScratchCooldown <= 0 && !cat2.dead) {
                if (heldShell2) {
                    heldShell2.shellVx = cat2.dir * 4;
                    heldShell2.vx = heldShell2.shellVx;
                    heldShell2.vy = -3;
                    heldShell2.x = cat2.x + (cat2.dir === 1 ? cat2.w + 4 : -heldShell2.w - 4);
                    heldShell2.y = cat2.y;
                    heldShell2 = null;
                } else {
                    startScratch2();
                }
                remoteInputs.scratch = false;
            }
            if (remoteInputs.fireball && hasFire && fireCooldown <= 0 && !cat2.dead) {
                shootFireball2();
                remoteInputs.fireball = false;
            }

            // Build compact state to send to guest
            const enemyData = level ? level.enemies.map(e => ({
                x: Math.round(e.x), y: Math.round(e.y), alive: e.alive, vx: e.vx,
                shell: e.shell || false
            })) : [];
            const coinData = level ? level.coins.map(c => c.collected) : [];
            const fbData = fireballs.map(fb => ({ x: Math.round(fb.x), y: Math.round(fb.y), vx: fb.vx, vy: fb.vy, life: fb.life }));

            const stateData = {
                type: 'state',
                level: currentLevel,
                state: state,
                cat: { x: Math.round(cat.x), y: Math.round(cat.y), vx: cat.vx, vy: cat.vy, dir: cat.dir, grounded: cat.grounded, dead: cat.dead, h: cat.h },
                cat2: { x: Math.round(cat2.x), y: Math.round(cat2.y), vx: cat2.vx, vy: cat2.vy, dir: cat2.dir, grounded: cat2.grounded, dead: cat2.dead, h: cat2.h },
                cam: Math.round(cam.x),
                score: score,
                coinCount: coinCount,
                lives: lives,
                p1HP: p1HP, p2HP: p2HP,
                hasFire: hasFire,
                enemies: enemyData,
                coins: coinData,
                fireballs: fbData,
                boss: boss ? { x: Math.round(boss.x), y: Math.round(boss.y), hp: boss.hp, alive: boss.alive, dir: boss.dir, phase: boss.phase, pirate: boss.pirate } : null,
                shakeTimer: shakeTimer, shakeAmt: shakeAmt
            };
            NetworkManager.send(stateData);
        }

        if (isOnlineGuest) {
            // Send local inputs to host
            const inputData = {
                type: 'input',
                keys: {
                    left: keys.left,
                    right: keys.right,
                    jump: keys.jump,
                    jumpPressed: keys.jumpPressed,
                    glide: keys.glide,
                    scratch: guestScratchFlag,
                    fireball: guestFireballFlag
                }
            };
            NetworkManager.send(inputData);
            keys.jumpPressed = false;
            guestScratchFlag = false;
            guestFireballFlag = false;
            // Guest doesn't run game logic — host sends state
        }
    }

    function nextLevel() {
        currentLevel++;
        if (currentLevel >= LEVEL_DATA.length) { state = 'win'; return; }
        loadLevel(currentLevel); state = 'playing'; overlay.classList.remove('visible');
    }

    function openShop() {
        // Skip shop on final level win or boss arena
        if (currentLevel >= LEVEL_DATA.length - 1) { nextLevel(); return; }
        state = 'shop'; shopSelection = 0;
        overlay.classList.remove('visible');
    }

    function tryBuyItem(idx) {
        const items = getVisibleShopItems();
        if (idx >= items.length) return;
        const item = items[idx];
        if (coinCount >= item.cost) {
            coinCount -= item.cost;
            item.action();
        }
    }

    function drawShop() {
        const visibleItems = getVisibleShopItems();
        if (shopSelection >= visibleItems.length) shopSelection = 0;
        // Dark overlay
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);

        // Shop title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🏪 SHOP', W / 2, 50);

        // Coin display
        ctx.fillStyle = '#FFF';
        ctx.font = '18px monospace';
        ctx.fillText('🪙 Coins: ' + coinCount, W / 2, 85);

        // Subtitle
        ctx.fillStyle = '#AAA';
        ctx.font = '12px monospace';
        ctx.fillText('Press 1-4 to buy  •  ← → to select  •  R to continue', W / 2, 110);

        // Item cards
        const itemW = 140, itemH = 130, gap = 20;
        const totalW = visibleItems.length * itemW + (visibleItems.length - 1) * gap;
        const startX = (W - totalW) / 2;
        const shopY = 130;

        visibleItems.forEach((item, i) => {
            const ix = startX + i * (itemW + gap);
            const selected = i === shopSelection;
            const canAfford = coinCount >= item.cost;

            // Card background
            if (selected) {
                ctx.fillStyle = canAfford ? 'rgba(255,215,0,0.25)' : 'rgba(255,80,80,0.2)';
                ctx.strokeStyle = canAfford ? '#FFD700' : '#FF4444';
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.08)';
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            }
            ctx.lineWidth = selected ? 3 : 1;
            ctx.beginPath();
            ctx.roundRect(ix, shopY, itemW, itemH, 8);
            ctx.fill(); ctx.stroke();

            // Number badge
            ctx.fillStyle = selected ? '#FFD700' : '#888';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('[' + (i + 1) + ']', ix + itemW / 2, shopY + 18);

            // Icon
            ctx.font = '28px sans-serif';
            ctx.fillText(item.icon, ix + itemW / 2, shopY + 52);

            // Name
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 13px monospace';
            ctx.fillText(item.name, ix + itemW / 2, shopY + 78);

            // Description
            ctx.fillStyle = '#AAA';
            ctx.font = '11px monospace';
            ctx.fillText(item.desc, ix + itemW / 2, shopY + 95);

            // Cost
            ctx.fillStyle = canAfford ? '#44FF44' : '#FF4444';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('🪙 ' + item.cost, ix + itemW / 2, shopY + 118);
        });

        // Continue button
        ctx.fillStyle = 'rgba(0,200,100,0.3)';
        ctx.strokeStyle = '#00CC66';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(W / 2 - 100, 290, 200, 40, 8);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CONTINUE [R]', W / 2, 316);

        // Items owned display
        ctx.fillStyle = '#888';
        ctx.font = '11px monospace';
        let owned = [];
        if (hasFire) owned.push('🔥 Fire');
        if (speedBoost > 0) owned.push('⚡ Speed +' + speedBoost);
        if (hasGlide) owned.push('🪂 Glide');
        if (shieldHits > 0) owned.push('🛡️ Shield ×' + shieldHits);
        if (owned.length) ctx.fillText('Equipped: ' + owned.join('  '), W / 2, 355);

        ctx.textAlign = 'left';
        ctx.lineWidth = 1;
    }

    function drawHotbar() {
        const slotSize = 36;
        const gap = 4;
        const totalW = MAX_INVENTORY * (slotSize + gap) - gap;
        const startX = (W - totalW) / 2;
        const startY = H - slotSize - 10;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(startX - 6, startY - 6, totalW + 12, slotSize + 12, 8);
        ctx.fill(); ctx.stroke();

        for (let i = 0; i < MAX_INVENTORY; i++) {
            const sx = startX + i * (slotSize + gap);
            const sy = startY;

            // Flash effect
            const isFlashing = hotbarFlash === i && hotbarFlashTimer > 0;

            // Slot background
            if (i < inventory.length) {
                ctx.fillStyle = isFlashing ? '#FFF' : inventory[i].color;
                ctx.globalAlpha = isFlashing ? 0.8 : 0.35;
                ctx.fillRect(sx, sy, slotSize, slotSize);
                ctx.globalAlpha = 1;
            }

            // Slot border
            ctx.strokeStyle = i < inventory.length ? '#FFF' : 'rgba(255,255,255,0.2)';
            ctx.lineWidth = i < inventory.length ? 1.5 : 1;
            ctx.strokeRect(sx, sy, slotSize, slotSize);

            // Slot number
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '8px monospace';
            ctx.fillText(String(i + 1), sx + 2, sy + 10);

            // Item icon
            if (i < inventory.length) {
                const item = inventory[i];
                // Draw mini version of power-up
                if (item.type === 'life') {
                    ctx.fillStyle = '#22CC66';
                    ctx.beginPath(); ctx.ellipse(sx + slotSize / 2, sy + 14, 8, 7, 0, Math.PI, 0); ctx.fill();
                    ctx.fillStyle = '#FFF5E0';
                    ctx.fillRect(sx + 12, sy + 14, 12, 8);
                    ctx.fillStyle = '#1a1a2e';
                    ctx.fillRect(sx + 14, sy + 16, 2, 2);
                    ctx.fillRect(sx + 20, sy + 16, 2, 2);
                } else if (item.type === 'fire') {
                    ctx.fillStyle = '#228B22';
                    ctx.fillRect(sx + 16, sy + 20, 3, 8);
                    ctx.fillStyle = '#FF4500';
                    ctx.beginPath(); ctx.arc(sx + 17, sy + 15, 6, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath(); ctx.arc(sx + 17, sy + 15, 3, 0, Math.PI * 2); ctx.fill();
                } else if (item.type === 'speed') {
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.moveTo(sx + 18, sy + 6); ctx.lineTo(sx + 24, sy + 6);
                    ctx.lineTo(sx + 18, sy + 16); ctx.lineTo(sx + 22, sy + 16);
                    ctx.lineTo(sx + 14, sy + 28); ctx.lineTo(sx + 18, sy + 18);
                    ctx.lineTo(sx + 14, sy + 18);
                    ctx.closePath(); ctx.fill();
                } else if (item.type === 'big') {
                    ctx.fillStyle = '#FF2222';
                    ctx.beginPath(); ctx.ellipse(sx + slotSize / 2, sy + 14, 8, 7, 0, Math.PI, 0); ctx.fill();
                    ctx.fillStyle = '#FFF5E0';
                    ctx.fillRect(sx + 12, sy + 14, 12, 8);
                    ctx.fillStyle = '#1a1a2e';
                    ctx.fillRect(sx + 14, sy + 16, 2, 2);
                    ctx.fillRect(sx + 20, sy + 16, 2, 2);
                } else if (item.type === 'shield') {
                    ctx.fillStyle = '#4488FF';
                    ctx.beginPath();
                    ctx.moveTo(sx + 18, sy + 6); ctx.lineTo(sx + 28, sy + 12);
                    ctx.lineTo(sx + 28, sy + 20); ctx.quadraticCurveTo(sx + 18, sy + 30, sx + 18, sy + 30);
                    ctx.quadraticCurveTo(sx + 18, sy + 30, sx + 8, sy + 20);
                    ctx.lineTo(sx + 8, sy + 12);
                    ctx.closePath(); ctx.fill();
                    ctx.fillStyle = '#FFF';
                    ctx.beginPath(); ctx.arc(sx + 18, sy + 17, 2, 0, Math.PI * 2); ctx.fill();
                }
            }
        }
        ctx.lineWidth = 1;
    }

    function drawCoopHP() {
        const bx = 8, by = H - 70;
        const rowH = 20;

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.roundRect(bx - 4, by - 4, 100, rowH * 2 + 12, 6);
        ctx.fill();

        // Helper: draw a heart
        function drawHeart(x, y, filled) {
            ctx.fillStyle = filled ? '#FF2222' : '#444';
            ctx.beginPath();
            ctx.moveTo(x + 5, y + 3);
            ctx.bezierCurveTo(x + 5, y, x, y, x, y + 3);
            ctx.bezierCurveTo(x, y + 6, x + 5, y + 9, x + 5, y + 11);
            ctx.bezierCurveTo(x + 5, y + 9, x + 10, y + 6, x + 10, y + 3);
            ctx.bezierCurveTo(x + 10, y, x + 5, y, x + 5, y + 3);
            ctx.fill();
        }

        // P1 row
        const skin1 = CAT_SKINS[selectedSkin];
        ctx.fillStyle = skin1.body;
        ctx.fillRect(bx, by + 2, 10, 10);
        ctx.fillStyle = skin1.ear;
        ctx.fillRect(bx, by, 3, 3); ctx.fillRect(bx + 7, by, 3, 3);
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(bx + 2, by + 5, 2, 2); ctx.fillRect(bx + 6, by + 5, 2, 2);
        ctx.fillStyle = '#FFF'; ctx.font = '8px monospace';
        ctx.fillText('P1', bx + 14, by + 10);
        for (let i = 0; i < 3; i++) drawHeart(bx + 32 + i * 14, by, i < p1HP);
        if (p1HP <= 0) {
            ctx.fillStyle = '#FF4444'; ctx.font = 'bold 7px monospace';
            ctx.fillText('OUT', bx + 78, by + 10);
        }

        // P2 row
        const p2y = by + rowH;
        const skin2 = CAT_SKINS[cat2SelectedSkin];
        ctx.fillStyle = skin2.body;
        ctx.fillRect(bx, p2y + 2, 10, 10);
        ctx.fillStyle = skin2.ear;
        ctx.fillRect(bx, p2y, 3, 3); ctx.fillRect(bx + 7, p2y, 3, 3);
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(bx + 2, p2y + 5, 2, 2); ctx.fillRect(bx + 6, p2y + 5, 2, 2);
        ctx.fillStyle = '#88CCFF'; ctx.font = '8px monospace';
        ctx.fillText('P2', bx + 14, p2y + 10);
        for (let i = 0; i < 3; i++) drawHeart(bx + 32 + i * 14, p2y, i < p2HP);
        if (p2HP <= 0) {
            ctx.fillStyle = '#FF4444'; ctx.font = 'bold 7px monospace';
            ctx.fillText('OUT', bx + 78, p2y + 10);
        }
    }

    function showOverlay(title, sub) {
        overlayTitle.textContent = title; overlaySub.textContent = sub;
        overlay.classList.add('visible');
    }

    // UPDATE
    function update() {
        // Network disconnect message
        if (netDisconnectTimer > 0) netDisconnectTimer--;

        if (state !== 'playing') return;
        frameCount++;
        if (shakeTimer > 0) shakeTimer--;
        if (scratchTimer > 0) scratchTimer--;
        if (scratchCooldown > 0) scratchCooldown--;
        if (hotbarFlashTimer > 0) hotbarFlashTimer--;
        if (cat2ScratchTimer > 0) cat2ScratchTimer--;
        if (cat2ScratchCooldown > 0) cat2ScratchCooldown--;

        // Online guest: skip local game logic, just render from host state
        if (isOnlineGuest) {
            frameCount++;
            // Still update particles/void for visual polish
            if (frameCount % 2 === 0) spawnVoidParticles();
            updateVoidParticles();
            // Send inputs to host
            networkSync();
            // Update HUD
            if (coopMode) {
                let p1Str = 'P1 ';
                for (let i = 0; i < 3; i++) p1Str += i < p1HP ? '❤️' : '🖤';
                let p2Str = ' P2 ';
                for (let i = 0; i < 3; i++) p2Str += i < p2HP ? '❤️' : '🖤';
                livesEl.textContent = p1Str + p2Str + (hasFire ? ' 🔥' : '');
            }
            coinEl.textContent = '🪙 × ' + coinCount;
            scoreEl.textContent = 'SCORE: ' + score;
            levelEl.textContent = boss ? (boss.pirate ? 'SKY BOSS' : 'BOSS') : (currentLevel >= 11 ? 'CAVE ' + (currentLevel - 10) : currentLevel >= 5 ? 'SKY ' + (currentLevel - 4) : 'WORLD ' + (currentLevel + 1));
            if (state === 'over') { showOverlay('GAME OVER', 'SCORE: ' + score + '\n\nPRESS SPACE TO RETRY'); }
            if (state === 'levelcomplete') { showOverlay('LEVEL COMPLETE!', 'SCORE: ' + score + '\n\nWAITING FOR HOST...'); }
            if (state === 'win') { showOverlay('YOU WIN! 🎉', 'FINAL SCORE: ' + score); }
            return;
        }

        updateCat(); updateCat2(); updateEnemies(); updateCoins(); updateOneUps(); updateFireFlowers(); updateFireballs(); updateArrows(); updateBoss(); updateCheckpoints(); checkFlag();
        updateStars();
        updatePowerUps();
        if (starPowerTimer > 0) starPowerTimer--;
        // Void
        if (frameCount % 2 === 0) spawnVoidParticles();
        updateVoidParticles();

        // Network sync (host sends state)
        if (isOnlineHost) networkSync();

        // HUD
        if (coopMode) {
            let p1Str = 'P1 ';
            for (let i = 0; i < 3; i++) p1Str += i < p1HP ? '❤️' : '🖤';
            let p2Str = ' P2 ';
            for (let i = 0; i < 3; i++) p2Str += i < p2HP ? '❤️' : '🖤';
            livesEl.textContent = p1Str + p2Str + (hasFire ? ' 🔥' : '') + (onlineMode ? ' 🌐' : '');
        } else {
            livesEl.textContent = '🐱 × ' + Math.max(0, lives) + (hasFire ? ' 🔥' : '');
        }
        coinEl.textContent = '🪙 × ' + coinCount;
        scoreEl.textContent = 'SCORE: ' + score;
        levelEl.textContent = boss ? (boss.pirate ? 'SKY BOSS' : 'BOSS') : (currentLevel >= 11 ? 'CAVE ' + (currentLevel - 10) : currentLevel >= 5 ? 'SKY ' + (currentLevel - 4) : 'WORLD ' + (currentLevel + 1));
        // Check game over
        if (state === 'over') { showOverlay('GAME OVER', 'SCORE: ' + score + '\n\nPRESS SPACE TO RETRY\nPRESS 2 FOR CO-OP'); }
        if (state === 'levelcomplete') { showOverlay('LEVEL COMPLETE!', 'SCORE: ' + score + '\n\nPRESS SPACE TO CONTINUE'); }
        if (state === 'win') { showOverlay('YOU WIN! 🎉', 'FINAL SCORE: ' + score + '\n\nPRESS SPACE TO PLAY AGAIN'); }
    }

    // DRAW
    function draw() {
        ctx.save();
        if (shakeTimer > 0) { const sx = (Math.random() - .5) * shakeAmt, sy = (Math.random() - .5) * shakeAmt; ctx.translate(sx, sy); }
        drawBackground();
        if (level) {
            // Draw void under gaps first (behind everything)
            drawVoid();
            // Tiles
            const startC = Math.max(0, Math.floor(cam.x / T) - 1);
            const endC = Math.min(level.cols, startC + COLS + 2);
            for (let r = 0; r < level.rows; r++) {
                for (let c = startC; c < endC; c++) {
                    if (level.grid[r][c] > 0) drawTile(r, c, level.grid[r][c]);
                }
            }
            drawQuestionHitAnim();
            // Coins, 1-Ups & Fire Flowers
            level.coins.forEach(drawCoin);
            stars.forEach(drawStar);
            powerUps.forEach(drawPowerUp);
            level.oneUps.forEach(drawOneUp);
            level.fireFlowers.forEach(drawFireFlower);
            // Checkpoints
            drawCheckpoints();
            // Ship decorations on sky levels
            if (currentLevel >= 5 && currentLevel <= 10) drawShipDecorations();
            // Enemies
            level.enemies.forEach(drawEnemy);
            // Fireballs
            fireballs.forEach(drawFireball);
            arrows.forEach(drawArrow);
            // Boss
            drawBoss();
            drawBossHP();
            // Cat
            drawCatSprite();
            if (coopMode) drawCat2Sprite();
            // Particles
            drawParticles();
            // Hotbar
            drawHotbar();
            // Co-op HP bars
            if (coopMode) drawCoopHP();
            // Online disconnect message
            if (netDisconnectTimer > 0) {
                const alpha = Math.min(1, netDisconnectTimer / 30);
                ctx.globalAlpha = alpha;
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(W / 2 - 160, H / 2 - 20, 320, 40);
                ctx.fillStyle = '#FF4444';
                ctx.font = 'bold 12px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(netDisconnectMsg, W / 2, H / 2 + 5);
                ctx.textAlign = 'left';
                ctx.globalAlpha = 1;
            }
            // Online mode indicator
            if (onlineMode && NetworkManager.isConnected) {
                ctx.fillStyle = '#00FF88';
                ctx.font = '7px "Press Start 2P", monospace';
                ctx.fillText('🌐 ONLINE', W - 90, H - 8);
            }
        }
        // Shop overlay
        if (state === 'shop') { drawShop(); }
        // Closet overlay
        if (state === 'closet') { drawCloset(); }
        ctx.restore();
    }

    function drawCloset() {
        // Dark overlay
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);
        // Title
        ctx.fillStyle = '#FFD700';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🐱 CAT CLOSET 🐱', W / 2, 35);
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillStyle = '#AAA';
        ctx.fillText('← → to browse  ENTER to buy/equip  T/ESC to close', W / 2, 52);
        // Coin balance
        ctx.fillStyle = '#FFD700';
        ctx.fillText('🪙 × ' + coinCount, W / 2, 68);

        // Skin cards (4 per row, 2 rows)
        const cols = 4, cardW = 150, cardH = 150, gap = 16;
        const totalW = cols * cardW + (cols - 1) * gap;
        const startX = (W - totalW) / 2;
        const startY = 80;

        for (let i = 0; i < CAT_SKINS.length; i++) {
            const row = Math.floor(i / cols), col = i % cols;
            const cx = startX + col * (cardW + gap);
            const cy = startY + row * (cardH + gap);
            const skin = CAT_SKINS[i];
            const isSelected = i === closetSelection;
            const isEquipped = i === selectedSkin;
            const isOwned = unlockedSkins[i];

            // Card background
            ctx.fillStyle = isSelected ? 'rgba(255,215,0,0.2)' : 'rgba(40,40,60,0.8)';
            ctx.fillRect(cx, cy, cardW, cardH);
            // Border
            ctx.strokeStyle = isSelected ? '#FFD700' : isEquipped ? '#66FF66' : isOwned ? '#888' : '#444';
            ctx.lineWidth = isSelected ? 3 : 1;
            ctx.strokeRect(cx, cy, cardW, cardH);

            // Mini cat preview
            const pcx = cx + cardW / 2 - 12, pcy = cy + 15;
            if (!isOwned) ctx.globalAlpha = 0.35;
            // Body
            ctx.fillStyle = skin.body; ctx.fillRect(pcx + 2, pcy + 10, 20, 16);
            ctx.fillStyle = skin.highlight; ctx.fillRect(pcx + 4, pcy + 12, 16, 12);
            // Head
            ctx.fillStyle = skin.body; ctx.fillRect(pcx + 6, pcy, 16, 14);
            ctx.fillStyle = skin.highlight; ctx.fillRect(pcx + 8, pcy + 2, 12, 10);
            // Ears
            ctx.fillStyle = skin.body; ctx.fillRect(pcx + 6, pcy - 4, 4, 6); ctx.fillRect(pcx + 16, pcy - 4, 4, 6);
            ctx.fillStyle = skin.ear; ctx.fillRect(pcx + 7, pcy - 3, 2, 4); ctx.fillRect(pcx + 17, pcy - 3, 2, 4);
            // Eyes
            ctx.fillStyle = '#FFF'; ctx.fillRect(pcx + 9, pcy + 4, 3, 3); ctx.fillRect(pcx + 14, pcy + 4, 3, 3);
            ctx.fillStyle = '#1a1a2e'; ctx.fillRect(pcx + 10, pcy + 5, 2, 2); ctx.fillRect(pcx + 15, pcy + 5, 2, 2);
            // Nose
            ctx.fillStyle = skin.nose; ctx.fillRect(pcx + 12, pcy + 8, 2, 2);
            // Legs
            ctx.fillStyle = skin.legs;
            ctx.fillRect(pcx + 4, pcy + 26, 4, 5); ctx.fillRect(pcx + 12, pcy + 26, 4, 5); ctx.fillRect(pcx + 18, pcy + 26, 4, 5);
            // Paws
            ctx.fillStyle = skin.paw;
            ctx.fillRect(pcx + 4, pcy + 30, 5, 2); ctx.fillRect(pcx + 12, pcy + 30, 5, 2); ctx.fillRect(pcx + 18, pcy + 30, 5, 2);
            // Tail
            ctx.fillStyle = skin.body; ctx.fillRect(pcx - 4, pcy + 8, 6, 4);
            ctx.fillStyle = skin.legs; ctx.fillRect(pcx - 6, pcy + 5, 4, 5);
            ctx.globalAlpha = 1;

            // Skin name
            ctx.fillStyle = isSelected ? '#FFD700' : '#CCC';
            ctx.font = '7px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(skin.name, cx + cardW / 2, cy + cardH - 38);

            // Status line
            if (isEquipped) {
                ctx.fillStyle = '#66FF66';
                ctx.font = '6px "Press Start 2P", monospace';
                ctx.fillText('✓ EQUIPPED', cx + cardW / 2, cy + cardH - 22);
            } else if (isOwned) {
                ctx.fillStyle = '#AAA';
                ctx.font = '6px "Press Start 2P", monospace';
                ctx.fillText('OWNED', cx + cardW / 2, cy + cardH - 22);
            } else {
                // Price tag
                const canAfford = coinCount >= skin.cost;
                ctx.fillStyle = canAfford ? '#FFD700' : '#FF4444';
                ctx.font = '7px "Press Start 2P", monospace';
                ctx.fillText('🔒 ' + skin.cost + ' 🪙', cx + cardW / 2, cy + cardH - 22);
                if (!canAfford && isSelected) {
                    ctx.fillStyle = '#FF6666';
                    ctx.font = '5px "Press Start 2P", monospace';
                    ctx.fillText('NOT ENOUGH COINS', cx + cardW / 2, cy + cardH - 10);
                }
            }
        }
        ctx.textAlign = 'left';
    }

    function loop() { update(); draw(); requestAnimationFrame(loop); }

    // INIT
    showOverlay('SUPER CAT WORLD', 'PRESS SPACE TO START\nPRESS 2 FOR CO-OP\nPRESS 3 FOR ONLINE');
    loop();
})();
