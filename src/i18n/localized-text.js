import { I18n } from "./index";

// Vue 2 functional components can return sibling VNodes. Keep the original number/highlight elements,
// while allowing a translation to reorder them. Catalogs supply text and never supply markup.
export const LocalizedText = {
  name: "LocalizedText",
  functional: true,
  props: {
    id: { type: String, required: true }
  },
  render(createElement, context) {
    const slots = {};
    for (const [name, render] of Object.entries(context.scopedSlots)) {
      if (/^p\d+$/u.test(name)) slots[name] = render();
    }
    const normalSlots = context.slots();
    for (const name of Object.keys(normalSlots)) if (!slots[name]) slots[name] = normalSlots[name];
    const values = {};
    for (const name of Object.keys(slots)) values[name] = `\uE000${name}\uE001`;
    const text = I18n.t(context.props.id, values);
    return text.split(/(\uE000p\d+\uE001)/u).flatMap(part => {
      const match = /^\uE000(p\d+)\uE001$/u.exec(part);
      return match ? slots[match[1]] ?? [] : [part];
    });
  }
};
