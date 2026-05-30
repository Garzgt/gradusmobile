# XLSX Observed Profile

This file captures observed metadata from the current sample XLSX exports.

## Source Files

1. BSBA_SecondSem_ClassSchedule.xlsx
2. BSHM_SecondSem_ClassSchedule.xlsx
3. BSIT_SecondSem_ClassSchedule.xlsx

## Workbook-Level Summary

1. BSBA:
- sheets: 13
- fonts: 33
- fills: 44
- cellXfs: 126

2. BSHM:
- sheets: 13
- fonts: 11
- fills: 16
- cellXfs: 149

3. BSIT:
- sheets: 10
- fonts: 16
- fills: 13
- cellXfs: 111

## Common Page Setup Pattern (Sheet 1)

1. Orientation: portrait
2. Paper size code: 14
3. Margins:
- left: 0.35
- right: 0.12
- top: 0.29
- bottom: 0.38
- header: 0.30
- footer: 0.30
4. Freeze pane: none
5. Print area defined name: none

## Common Core Column Width Pattern

A to G widths observed (approx):
1. A: 13.55
2. B: 16.33
3. C: 16.66
4. D: 17.11
5. E: 17.66
6. F: 17.00
7. G: 17.44

## Variant Notes

1. BSBA and BSHM sheet1
- rows: 79
- cols: 7

2. BSIT sheet1
- rows: 100
- cols: 8
- includes additional width block for columns 8 to 11 at about 8.66

3. Some BSBA tabs include 11 styled columns with:
- H as spacer style
- I to L styled columns (often blank content)

## Typography Observations

1. Font families observed:
- Arial Narrow
- Calibri

2. Font size range observed:
- BSBA: 8, 10, 11, 12, 13, 15, 18
- BSHM: 9, 10, 11, 12
- BSIT: 10, 11, 12

## Course Table Placement Example (BSBA sample tab)

Observed around rows 40 to 51 in columns D to G:
1. D40: Course Code
2. E40: Course Title
3. G40: Lec/ (Lab) Units
4. Units per row in G42 to G49
5. Total units at G51

## Color Fill Observations

Common fill colors found across samples include:
1. #00B050
2. #00B0F0
3. #FF0000
4. #FFFF00
5. #FFC000
6. #A5A5A5
7. #7F7F7F
8. #BFBFBF
9. #B2A1C7
10. #D99594
11. #C6EFCE
12. #FFC7CE
13. #FFEB9C
14. #FFCC99
15. #FFFFCC
16. #F2F2F2
17. #92D050

## Implementation Note

Do not hard-code one single worksheet geometry for all programs.
Use a template-aware generator that supports the observed variants while preserving the same visual identity.
