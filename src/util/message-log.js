import signale from "signale";

const methods = {
  yellow: {
    badge: "🔶",
    label: "",
    color: "yellow",
    logLevel: "info",
  },
  blue: {
    badge: "🔷",
    label: "",
    color: "blue",
    logLevel: "info",
  },
  textOnly: {
    badge: "",
    label: "",
    color: "yellow",
    logLevel: "info",
  },
  build: {
    badge: "📦",
    color: "blue",
    label: "building",
    logLevel: "info",
  },
  deployed: {
    badge: "🚀",
    color: "green",
    label: "deployed",
    logLevel: "info",
  },
};

const newScope = (options = {}) => {
  const logger = new signale.Signale({ ...options });
  return logger;
};

const global = new signale.Signale({ interactive: false, scope: "JAMStack", types: methods });

const scopes = {
  ...global,
  init: {
    ...global.scope("JAMStack", "Init"),
    interactive: newScope({ interactive: true, scope: ["JAMStack", "Init"], types: methods }),
  },
  prebuild: {
    ...global.scope("JAMStack", "Prebuild"),
    interactive: newScope({ interactive: true, scope: ["JAMStack", "Prebuild"], types: methods }),
  },
  build: {
    ...global.scope("JAMStack", "Build"),
    interactive: newScope({ interactive: true, scope: ["JAMStack", "Build"], types: methods }),
  },
  deploy: {
    ...global.scope("JAMStack", "Deploy"),
    interactive: newScope({ interactive: true, scope: ["JAMStack", "Deploy"], types: methods }),
  },
  deployCreate: {
    ...global.scope("JAMStack", "Deploy", "Create"),
    interactive: newScope({ interactive: true, scope: ["JAMStack", "Deploy", "Create"], types: methods }),
  },
  deployUpdate: {
    ...global.scope("JAMStack", "Deploy", "Update"),
    interactive: newScope({ interactive: true, scope: ["JAMStack", "Deploy", "Update"], types: methods }),
  },
  deployStorage: {
    ...global.scope("JAMStack", "Deploy", "Storage"),
    interactive: newScope({ interactive: true, scope: ["JAMStack", "Deploy", "Storage"], types: methods }),
  },
};

export default scopes;
