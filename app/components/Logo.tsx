export default function Logo({ size = 80 }: { size?: number }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* First F — orange */}
        <g transform="translate(10, 15)">
          <rect x="0" y="0" width="10" height="60" fill="#f97316" rx="2" />
          <rect x="0" y="0" width="36" height="10" fill="#f97316" rx="2" />
          <rect x="0" y="24" width="26" height="9" fill="#f97316" rx="2" />
        </g>
  
        {/* Second F — white, flipped, nearly touching */}
        <g transform="translate(72, 83) rotate(180)">
          <rect x="0" y="0" width="10" height="60" fill="#ffffff" rx="2" />
          <rect x="0" y="0" width="36" height="10" fill="#ffffff" rx="2" />
          <rect x="0" y="24" width="26" height="9" fill="#ffffff" rx="2" />
        </g>
      </svg>
    );
  }