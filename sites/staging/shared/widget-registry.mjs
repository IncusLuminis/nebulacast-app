/** Registry for the widget definitions available to the platform runtime. */

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function freezeDefinition(definition) {
  return Object.freeze({
    ...definition,
    defaults: Object.freeze({ ...(definition.defaults || {}) }),
    capabilities: Object.freeze({ ...(definition.capabilities || {}) }),
  });
}

function validateDefinition(definition) {
  if (!isObject(definition)) throw new TypeError("Widget definition must be an object");
  if (typeof definition.type !== "string" || !definition.type.trim()) {
    throw new TypeError("Widget definition type must be a non-empty string");
  }
  if (!Number.isInteger(definition.version) || definition.version < 1) {
    throw new TypeError(`Widget definition ${definition.type} version must be a positive integer`);
  }
  if (definition.defaults !== undefined && !isObject(definition.defaults)) {
    throw new TypeError(`Widget definition ${definition.type} defaults must be an object`);
  }
  if (definition.capabilities !== undefined && !isObject(definition.capabilities)) {
    throw new TypeError(`Widget definition ${definition.type} capabilities must be an object`);
  }
  if (typeof definition.loader !== "function") {
    throw new TypeError(`Widget definition ${definition.type} loader must be a function`);
  }
  if (Object.prototype.hasOwnProperty.call(definition, "mount")) {
    throw new TypeError(`Widget definition ${definition.type} cannot provide an arbitrary mount function`);
  }
}

export function createWidgetRegistry(definitions = []) {
  const definitionsByType = new Map();

  const registry = {
    register(definition) {
      validateDefinition(definition);
      const type = definition.type.trim();
      if (definitionsByType.has(type)) throw new Error(`Widget type already registered: ${type}`);
      const frozen = freezeDefinition({ ...definition, type });
      definitionsByType.set(type, frozen);
      return frozen;
    },

    get(type) {
      return definitionsByType.get(type);
    },

    list() {
      return Object.freeze([...definitionsByType.values()]);
    },
  };

  for (const definition of definitions) registry.register(definition);
  return registry;
}
