function Section({ icon, title, children }) {
  return (
    <div className="rounded-xl border border-cream/10 bg-surface-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-cream">
        <span className="material-symbols-outlined text-brand-orange">{icon}</span>
        {title}
      </h3>
      <div className="mt-2 flex flex-col gap-1.5 text-sm text-text-muted">{children}</div>
    </div>
  );
}

function Steps({ items }) {
  return (
    <ol className="list-decimal space-y-1 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  );
}

export default function HelpView() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-cream">
            <span className="material-symbols-outlined text-brand-orange">help</span>
            Help
          </h2>
          <p className="mt-1 text-sm text-text-muted">How each part of the terminal works.</p>
        </div>

        <Section icon="point_of_sale" title="Taking a walk-in / dine-in / takeaway order">
          <Steps
            items={[
              "Pick a category (and a subcategory pill if it has one) at the top, or search a deal from the Deals category.",
              "Tap a product to add it. If it has sizes, add-ons or modifiers, a customize screen opens first -- pick options and confirm.",
              "Adjust quantity or add a note on any line in the cart on the right.",
              "If the customer is a member, toggle Member in Checkout for their discount.",
              "Tap Checkout: pick order type (Dine-in/Takeaway/Delivery), fill in table/address if needed, and adjust Discount Amount or Delivery Charges manually if this order needs it.",
              "Tap Send to Kitchen. No payment is taken yet and no tax is added at this point -- both happen when the bill is printed.",
            ]}
          />
        </Section>

        <Section icon="notifications" title="Online orders (Queue)">
          <p>Orders placed on the website land here automatically with a sound alert.</p>
          <Steps
            items={[
              "Open the order from the Queue and tap Confirm & Send to Kitchen -- this removes it from the incoming queue.",
              "Use KOT to reprint the kitchen ticket any time after that.",
              "Online orders are always Cash on Delivery -- tap Complete Order (Paid) once the rider collects payment on delivery.",
            ]}
          />
        </Section>

        <Section icon="receipt_long" title="Bills, tax and payment method">
          <p>
            An order's payment method (Cash vs Card/Online) isn't decided when it's sent to the kitchen -- it's asked
            the first time you print or preview its Customer Bill. Whichever you pick sets the tax rate and locks
            it onto the bill.
          </p>
          <p>
            Changed your mind later? Mark Paid lets you pick the payment method again at that point, and the total
            is recalculated for the correct tax.
          </p>
        </Section>

        <Section icon="edit" title="Editing an order">
          <p>
            Any order that isn't paid yet or cancelled can still be edited -- open it from the Orders tab or the
            Queue and tap Edit to adjust its Delivery Charges, Discount Amount, or Extra Charges. The total
            recalculates automatically.
          </p>
        </Section>

        <Section icon="tune" title="Deals">
          <p>Tap a deal card to add its whole bundle straight to the cart -- there's no separate confirm step.</p>
        </Section>

        <Section icon="print" title="Printer setup">
          <p>Tap the printer icon at the bottom of the sidebar, enter the thermal printer's IP address on your network, and Connect. Use the network-check button to test it's reachable first.</p>
        </Section>

        <Section icon="display_settings" title="Display size">
          <p>Settings tab → Display Size. Makes everything bigger or smaller (text, buttons, spacing) if it's hard to read. Saved on this terminal.</p>
        </Section>
      </div>
    </div>
  );
}
