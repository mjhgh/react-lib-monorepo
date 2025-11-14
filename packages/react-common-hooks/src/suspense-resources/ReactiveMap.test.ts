import { describe, it, expect } from "vitest";
import { ReactiveMap } from "./ReactiveMap";

describe("ReactiveMap", () => {
  it("should notify listeners on set, update, delete, and clear", () => {
    const map = new ReactiveMap<string, number>();
    const events: any[] = [];
    map.subscribe((info) => events.push(info));

    map.set("a", 1); // set
    map.set("a", 2); // update
    map.set("b", 3); // set
    map.delete("a"); // delete
    map.clear(); // clear

    expect(events).toEqual([
      { type: "set", key: "a", value: 1 },
      { type: "update", key: "a", value: 2, prevValue: 1 },
      { type: "set", key: "b", value: 3 },
      { type: "delete", key: "a", prevValue: 2 },
      { type: "clear" },
    ]);
  });

  it("should unsubscribe listener on abort", () => {
    const map = new ReactiveMap<string, number>();
    const events: any[] = [];
    const controller = new AbortController();
    map.subscribe((info) => events.push(info), controller.signal);
    map.set("x", 10);
    controller.abort();
    map.set("y", 20);
    expect(events).toEqual([{ type: "set", key: "x", value: 10 }]);
  });
});
