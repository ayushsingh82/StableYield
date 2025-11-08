# Token Name Changes Documentation

This document lists all the file and directory renames performed to update the token naming convention.

## Token Name Mapping

- `CUSD` → `wUSDC`
- `sCUSD` → `stUSDC`
- `stCORE` → `stTOKEN`

---

## Contract Directories and Files

### 1. CUSD → wUSDC
- **Directory:** `src/contracts/CUSD.sol/` → `src/contracts/wUSDC.sol/`
- **Files:**
  - `CUSD.json` → `wUSDC.json`
  - `CUSD.dbg.json` → `wUSDC.dbg.json`

### 2. sCUSD → stUSDC
- **Directory:** `src/contracts/sCUSD.sol/` → `src/contracts/stUSDC.sol/`
- **Files:**
  - `sCUSD.json` → `stUSDC.json`
  - `sCUSD.dbg.json` → `stUSDC.dbg.json`

### 3. stCORE → stTOKEN
- **Directory:** `src/contracts/stCORE.sol/` → `src/contracts/stTOKEN.sol/`
- **Files:**
  - `stCORE.json` → `stTOKEN.json`
  - `stCORE.dbg.json` → `stTOKEN.dbg.json`

---

## Component Files

### 4. MintCusdButton → MintwUSDCButton
- **File:** `src/app/components/MintCusdButton.tsx` → `src/app/components/MintwUSDCButton.tsx`
- **Component Export:** `MintwUSDCButton`

### 5. MintCusdToOperator → MintwUSDCToOperator
- **File:** `src/app/components/MintCusdToOperator.tsx` → `src/app/components/MintwUSDCToOperator.tsx`
- **Component Export:** `MintwUSDCToOperator`

### 6. OperatorCUSDBalance → OperatorwUSDCBalance
- **File:** `src/app/components/OperatorCUSDBalance.tsx` → `src/app/components/OperatorwUSDCBalance.tsx`
- **Component Export:** `OperatorwUSDCBalance`

---

## Summary

**Total Changes:**
- 3 contract directories renamed
- 6 contract JSON files renamed
- 3 component files renamed

**Date:** Created during token name migration from CUSD/sCUSD/stCORE to wUSDC/stUSDC/stTOKEN

---

## Note

The code changes (variable names, imports, function names, etc.) were already updated in the source files. This document only tracks the physical file and directory renames that were performed to match the new naming convention.


