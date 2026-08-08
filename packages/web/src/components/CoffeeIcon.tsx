export function CoffeeIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M9 11h13.5c.8 0 1.5.7 1.5 1.5v8.5c0 2.2-1.8 4-4 4h-8.5c-2.2 0-4-1.8-4-4v-8.5c0-.8.7-1.5 1.5-1.5z"
        fill="#8D6E63"
      />
      <path
        d="M23.5 13.5c2.8 0 4.2 1.8 4.2 3.8s-1.4 3.8-4.2 3.8"
        stroke="#8D6E63"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 13.5h11.5"
        stroke="#5D4037"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}
