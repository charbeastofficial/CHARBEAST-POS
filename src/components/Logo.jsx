import logoUrl from '../assets/logo.png';

export default function Logo({ size = 'lg' }) {
  if (size === 'icon' || size === 'header') {
    const box = size === 'header' ? 'h-28 w-28 p-2.5' : 'h-16 w-16 p-2';
    return (
      <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl ${box}`}>
        <img src={logoUrl} alt="CharBeast" className="h-full w-full object-contain" />
      </div>
    );
  }

  if (size === 'sm') {
    return (
      <div className="flex items-center justify-center gap-2 px-1">
        <img
          src={logoUrl}
          alt="CharBeast"
          className="h-auto w-full object-contain"
          style={{ maxWidth: '40px' }}
        />
        <span className="font-display text-xl tracking-[0.15em] text-cream">
          CHAR<span className="text-brand-orange">BEAST</span>
        </span>
      </div>
    );
  }

  // lg size (default) - matches footer logo style
  return (
    <div className="flex flex-col items-center justify-center mb-6">
      <img
        src={logoUrl}
        alt="CharBeast"
        className="h-auto w-full object-contain"
        style={{ maxWidth: '160px' }}
      />
      <span className="font-display mt-2 text-3xl tracking-[0.15em] text-cream">
        CHAR<span className="text-brand-orange">BEAST</span>
      </span>
    </div>
  );
}