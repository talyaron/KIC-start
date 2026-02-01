export const RARITIES = {
  MIL_SPEC: {
    name: 'Mil-Spec',
    rank: 1,
    color: '#4b69ff',
    chance: 0.7992,
    baseValue: [0.10, 0.50]
  },
  RESTRICTED: {
    name: 'Restricted',
    rank: 2,
    color: '#8847ff',
    chance: 0.1598,
    baseValue: [0.80, 2.50]
  },
  CLASSIFIED: {
    name: 'Classified',
    rank: 3,
    color: '#d32ce6',
    chance: 0.032,
    baseValue: [3.50, 12.00]
  },
  COVERT: {
    name: 'Covert',
    rank: 4,
    color: '#eb4b4b',
    chance: 0.0064,
    baseValue: [15.00, 85.00]
  },
  GOLD: {
    name: 'Rare Special',
    rank: 5,
    color: '#ffd700',
    chance: 0.0026,
    baseValue: [150.00, 1500.00]
  },
};

const CDN_BASE = 'https://steamcommunity-a.akamaihd.net/economy/image/';
const SIZE = '/360fx360f';

export const CASES = [
  {
    id: 'ultimate',
    name: 'The Ultimate Collection',
    type: 'case',
    price: 4.5,
    image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frnMVu6b-avA-JqSSCjSWwuhz47U9TCzlxh9yt2WGnNqgIi-fbgUkWMNxFPlK7EdIJF6a2Q${SIZE}`,
    items: [
      // Mil-Spec
      { name: 'M249 | Spectre', rarity: 'MIL_SPEC', image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8zMK5wiFO0P_8PP1SM-CWDXOCxNF6ueZhW2fqwklx4j_Wyd_6J3yeOlcoXMclQuQI4xbrw4fmNrziswLX2IhHziqrkGoXuVEVHa_j${SIZE}` },
      { name: 'MP9 | Bioleak', rarity: 'MIL_SPEC', image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8js_f_C9k4uL3V6ZkL_yWD2yvzedxuPUnHSi3xhgm4GSGm4mpcnyTbVQjWcZ5EeIL50LultzgNbvmtAPf3oJByDK-0H0NB5p7wQ${SIZE}` },
      { name: 'P2000 | Oceanic', rarity: 'MIL_SPEC', image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL5lYayrXIL0Pq3V7Q_cKDDMWiTxO94ud5lRi67gVNysmuGzt_9JSiQaQJ0C8MkTLJbskHrk4fnZe3isgfZg4tMnySoiX8Y8G81tHDFigbI${SIZE}` },
      { name: 'Dual Berettas | Ventilators', rarity: 'MIL_SPEC', image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL0kp_0-B1c_M2qfaVhIvWBC3OEwP1JpuRnWyC_lAkooS66lob-KT-JblNxDcMiQe8M5hDtxtfnNrvrswyLjdgWzCyvhytP7ilqt7pXBfdz-rqX0V-MxKZG7g${SIZE}` },
      { name: 'SG 553 | Atlas', rarity: 'MIL_SPEC', image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLimcO1qx1Y-s29b_E4c8-SGmuR0tF6ueZhW2fgkxt_tTndn46rJX6QOAEoC5QhEe5f5hHqltfgMeO0tQHY2IsTyyyokGoXuYh0VG-5${SIZE}` },
      { name: 'P2000 | Gnarled', rarity: 'MIL_SPEC', image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL5lYayrXIL0PO_V7Q_cKDDMWuf0vpJp-57Qy2MmRQguynLyt38dXjDaA5zC5YlQ-Nc5BG5k93mP-jhsVeKiY8XmSr5iy5J7C1s6_FCD_TbNBDIDw${SIZE}` },
      { name: 'SSG 08 | Mainframe 001', rarity: 'MIL_SPEC', image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLijZGwpR1Y-s29e6M9eM-eD26ex_x3veRWQyC0nQlptzjSntqgJS6Wbg5xDZVwTbUN5EO5ldWxYem04waP2IsUyX_5in4c6zErvbh54g-58w${SIZE}` },

      // Restricted
      { name: 'CZ75-Auto | Red Astor', rarity: 'RESTRICTED', image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLyhMG1_B1c_M2tcvM4Ic-BC2OR0vp5ot5lRi67gVMh5D_cwor7cy7GZ1UpA8F0QrQP5BjuwdHiZr7r5FeNjIpAmyT8hnlI8G81tORsc2LX${SIZE}` },
      { name: 'Galil AR | Firefight', rarity: 'RESTRICTED', image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2n5rp8SNJ0PW9V6NsLPmfD3WvyOB1te9sXSinmg8YvzSCkpu3eH_EZ1IgDsR1ReYPshm6x9XnZe204VCMiIsXzS_33S0b7X5t4-dQUb1lpPOTHSUAOw${SIZE}` },
      { name: 'SSG 08 | Ghost Crusader', rarity: 'RESTRICTED', image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLijZGwpR1c_M29e6M9eM-SHGqRwuFktd5lRi67gVN_6jnQzYmhc3jFbgUoA5J3ReYIsRO8ktGyM-iz4AaMi4hDzyqsiSJJ8G81tKe_wmAg${SIZE}` },

      // Classified
      { name: 'AUG | Fleet Flock', rarity: 'CLASSIFIED', image: `${CDN_BASE}-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot6-iFAZzxf7cZit9_8i_kL-HnvD8J_WEkm9XupZ33OiUrY7xjFfmrkZkYm71Jo-TI1dqZ1HQ-VK7krzvjInp6pzNwXZqvHYat36AmBW_0AYMMLK860h9Xg${SIZE}` },
      { name: 'P250 | Asiimov', rarity: 'CLASSIFIED', image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwiFO0OL8PfRSIeOaB2qf19F6ueZhW2fixx53tWqEm4ugeXuebQN0CZJyRrMJuxm4loCyPr_i51TfjtgXzi79kGoXuUXmUJzm${SIZE}` },
      { name: 'UMP-45 | Primal Saber', rarity: 'CLASSIFIED', image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkk4a0qB1Y-s27ZbQ5dc-DHG6dwOJlseNsXRa_nBovp3PRn478JHmePQ8hDcF2Q7YDtxXrk92zYbyw7gXYjIhEyCn_3Hsbui44_a9cBklqRdMs${SIZE}` },
      { name: 'AK-47 | Ice Coaled', rarity: 'CLASSIFIED', image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLijZGwpR1Y-s29e6M9eM-eD26ex_x3veRWQyC0nQlptzjSntqgJS6Wbg5xDZVwTbUN5EO5ldWxYem04waP2IsUyX_5in4c6zErvbh54g-58w${SIZE}` },

      // Covert
      { name: "M4A1-S | Chantico's Fire", rarity: 'COVERT', image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_OGMWrEwL9lj_JmWiWnlBYioQKJk4jxNWXFZ1IgC5MiQuZeuhK4wIXnMuPhslCM2oMTxH75hnxK6Htjse4BVqd25OSJ2DU2Q_CD${SIZE}` },
      { name: 'PP-Bizon | Judgement of Anubis', rarity: 'COVERT', image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzl4zv8x1Y-s2sYb5iLs-QG3WDxNF6ueZhW2fkzU0isDvTnomsdS7BbwF0A8ElROJfshC8wN3jYu-2tQ3c2osTxCitkGoXuVioOA3_${SIZE}` },
      { name: 'Desert Eagle | Printstream', rarity: 'COVERT', image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7OeRbKFsJ8-DHG6e1f1iouRoQha_nBovp3OGmdeqInyVP1V0XsYlRbEI50a5wNyzZr605AyI3t5MmCSohylAuC89_a9cBoMY9UkV${SIZE}` },
      { name: 'AK-47 | Legion of Anubis', rarity: 'COVERT', image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLijZGwpR1Y-s29e6M9eM-eD26ex_x3veRWQyC0nQlptzjSntqgJS6Wbg5xDZVwTbUN5EO5ldWxYem04waP2IsUyX_5in4c6zErvbh54g-58w${SIZE}` },
      { name: 'USP-S | Printstream', rarity: 'COVERT', image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA_v5kue99XD2hkBwqjDGMnYftb3yUPFR0XsNyRrNc5kO5ltziMenr5lONj4kXyi2riywc7y9o5LtQAqQ7uvqAkScWnv4${SIZE}` },
      { name: 'AWP | Chromatic Aberration', rarity: 'COVERT', image: `${CDN_BASE}i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6dlMv-eD1iAyOB9j-1gSCGn2x50tT_Tm9f4cXORPA4oWJckFOMLtha_x9e1Nu-35QfbjYtHyiythitXrnE8ylr09zg${SIZE}` },

      // Gold
      { name: '★ Doppler Knife', rarity: 'GOLD', image: `${CDN_BASE}-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf1fLEcjVL49KJlY60g_7zNqnumXlQ5sJ0teXI8oThxlbt-hZqYjr7ctXGdQU8YAnS_Vm3k7-9g8e67szInXU3uCdz4XfD3wbbaL_vEA${SIZE}` },
      { name: '★ Skeleton Knife', rarity: 'GOLD', image: `${CDN_BASE}-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf1fLEcjVL49KJlY60g_7zNqnumXlQ5sJ0teXI8oThxlbt-hZqYjr7ctXGdQU8YAnS_Vm3k7-9g8e67szInXU3uCdz4XfD3wbbaL_vEA${SIZE}` },
      { name: '★ Marble Fade Gloves', rarity: 'GOLD', image: `${CDN_BASE}-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf1fLEcjVL49KJlY60g_7zNqnumXlQ5sJ0teXI8oThxlbt-hZqYjr7ctXGdQU8YAnS_Vm3k7-9g8e67szInXU3uCdz4XfD3wbbaL_vEA${SIZE}` },
    ],
  }
];
