export default function CategoryBar({ categories, deals, activeCategory, onSelectCategory, brokenImageIds, markImageBroken }) {
  // Selecting a top-level category that has subcategories surfaces those as
  // a second row of pills to narrow further, same pattern as the customer
  // website's menu.
  const activeCategoryObj = categories.find((c) => c.id === activeCategory) || null;
  const activeTopLevelId = activeCategoryObj?.parentId || activeCategory;
  const activeTopLevelCategory = categories.find((c) => c.id === activeTopLevelId) || null;
  const subCategories = categories
    .filter((c) => c.parentId === activeTopLevelId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-cream/10 bg-surface-elevated px-5 py-3">
      <div className="flex items-center gap-2 overflow-x-auto">
        <Chip
          label="All"
          icon="🍽️"
          active={activeCategory === "all"}
          onClick={() => onSelectCategory("all")}
        />
        {deals.length > 0 && (
          <Chip
            label="Deals"
            icon="🔥"
            active={activeCategory === "deals"}
            onClick={() => onSelectCategory("deals")}
            deals
          />
        )}
        {categories.filter((cat) => !cat.parentId).map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            icon={cat.icon}
            image={!brokenImageIds.has(cat.id) ? cat.imageURL : null}
            onImageError={() => markImageBroken(cat.id)}
            active={activeCategory === cat.id}
            onClick={() => onSelectCategory(cat.id)}
          />
        ))}
      </div>

      {activeCategory !== "all" && activeCategory !== "deals" && subCategories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <SubPill
            label={`All ${activeTopLevelCategory?.name || ""}`}
            active={activeCategory === activeTopLevelId}
            onClick={() => onSelectCategory(activeTopLevelId)}
          />
          {subCategories.map((sub) => (
            <SubPill
              key={sub.id}
              label={sub.name}
              active={activeCategory === sub.id}
              onClick={() => onSelectCategory(sub.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold whitespace-nowrap transition ${
        active
          ? "bg-brand-orange/20 text-brand-orange-soft ring-1 ring-brand-orange/40"
          : "text-text-muted ring-1 ring-cream/10 hover:text-cream"
      }`}
    >
      {label}
    </button>
  );
}

function Chip({ label, icon, image, onImageError, active, onClick, deals }) {
  const activeBg = deals ? "bg-brand-yellow text-white shadow-[0_2px_8px_rgba(180,83,9,0.25)]" : "bg-brand-orange text-white shadow-[0_2px_8px_rgba(255,87,34,0.2)]";
  const activeLine = deals ? "bg-brand-yellow" : "bg-brand-orange";

  return (
    <button
      onClick={onClick}
      className={`relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
        active
          ? activeBg
          : "bg-white text-text-muted border border-cream/10 hover:border-cream/25 hover:text-cream hover:shadow-sm"
      }`}
    >
      {image ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-md">
          <img src={image} alt="" className="h-full w-full object-cover" onError={onImageError} />
        </span>
      ) : icon ? (
        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-sm ${active ? "" : "opacity-70"}`}>
          {icon}
        </span>
      ) : null}
      <span className={`whitespace-nowrap ${active ? "text-white" : "text-cream"}`}>{label}</span>
      {active && (
        <span className={`absolute -bottom-[13px] left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full ${activeLine}`} />
      )}
    </button>
  );
}