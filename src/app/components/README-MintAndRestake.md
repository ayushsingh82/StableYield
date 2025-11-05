# MintAndRestake Component

A React component that provides a button to mint 10 stCORE tokens and automatically delegate them to the operator, with a modal showing the two-step process.

## Features

- **Two-Step Process**: First mints 10 stCORE, then delegates it to the operator
- **Modal Interface**: Beautiful modal with step-by-step progress indication
- **Automatic Flow**: Step 2 starts automatically after step 1 completes
- **Real-time Balance**: Shows current stCORE balance
- **Transaction Tracking**: Displays transaction hashes for each step
- **Error Handling**: Proper error handling with user feedback

## Usage

### Basic Usage

```tsx
import MintAndRestakeButton from './components/MintAndRestake';

function MyComponent() {
  return (
    <MintAndRestakeButton />
  );
}
```

### With Callbacks

```tsx
import MintAndRestakeButton from './components/MintAndRestake';

function MyComponent() {
  const handleComplete = () => {
    console.log('Mint and delegate process completed!');
    // Refresh your data or show success message
  };

  return (
    <MintAndRestakeButton 
      onComplete={handleComplete}
      showBalance={true}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onComplete` | `() => void` | `undefined` | Callback function called when both steps are completed |
| `showBalance` | `boolean` | `true` | Whether to show the current stCORE balance in the button |

## Component Structure

### MintAndRestakeButton
The main component that renders the button and manages the modal state.

### MintAndRestakeModal
The modal component that displays the two-step process with:
- Step 1: Mint 10 stCORE
- Step 2: Delegate to Operator

## Process Flow

1. **User clicks button** → Modal opens
2. **User clicks "Start Process"** → Step 1 begins
3. **Step 1: Mint stCORE** → Calls `stCORE.mint(10)` function
4. **Step 1 completes** → Step 2 automatically starts
5. **Step 2: Delegate** → Calls `Eigen.addDelegation(10)` function
6. **Step 2 completes** → Modal shows completion state
7. **User clicks "Complete"** → Modal closes, `onComplete` callback triggered

## Contract Integration

The component integrates with:
- **stCORE Contract**: For minting tokens
- **Eigen Contract**: For delegation to operator
- **Contract Addresses**: From `deployed-address.json`

## Styling

The component uses Tailwind CSS classes and follows the existing design system:
- Orange accent color (`#FF8C00`)
- Dark theme with black backgrounds
- Glowing effects on hover
- Responsive design

## Error Handling

- Wallet connection validation
- Transaction simulation before execution
- Proper error messages for failed transactions
- Graceful fallback to previous step on errors

## Dependencies

- React 18+
- Wagmi (for wallet connection and contract interactions)
- Viem (for blockchain utilities)
- React DOM (for portal rendering)

## Example Demo

See `/mint-and-restake-demo` page for a complete example of how to use this component.
