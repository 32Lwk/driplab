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
        d="M6 12h16c1.1 0 2 .9 2 2v2c0 3.3-2.7 6-6 6H10c-3.3 0-6-2.7-6-6v-2c0-1.1.9-2 2-2z"
        fill="#8D6E63"
      />
      <path
        d="M24 14h2c1.1 0 2 .9 2 2v1c0 2.2-1.8 4-4 4h-1"
        stroke="#5D4037"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 24c0 2 2 3 6 3s6-1 6-3"
        stroke="#5D4037"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 8c1-2 3-3 4-3s3 1 4 3"
        stroke="#BCAAA4"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
