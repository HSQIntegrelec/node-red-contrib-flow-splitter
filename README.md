# node-red-flow-splitter

Node-RED plugin to split your flows.json file in individual YAML or JSON files (per tab, subflow and config-node).

## Purpose

This plugin is useful if you regularly work with Node-RED in the project mode.

It will make the diffs of your version control much more controlled and readable.

## Functioning

This plugin does not modify Node-RED core behaviour. Node-RED core will still compile the your flows into the JSON file stipulated in the `package.json`.

The code is executed at each start of the flows, i.e. a start of Node-RED or a "deploy" action.

It will take the running JSON file used by Node-RED specified in the Node-RED `package.json` (**_flows.json_** by default) and create all files in the directory `src` (_by default_) and their sub-directories : `tabs`, `subflows` and `config-nodes` at the root of the Node-RED userDir or the active project folder.

The plugin will generate a configuration file `.config.flow-splitter.json` at the root of the Node-RED userDir or the active project folder.

Default configuration file =

```json
{
  "fileFormat": "yaml",
  "destinationFolder": "src",
  "tabsOrder": []
}
```

The user can edit freely this file, the changes are taken into account at the next restart of the flows.

- `fileFormat`: parsing language for your split source files (either `yaml` or `json`)
- `destinationFolder`: path where to create the `tabs`, `subflows` and `config-nodes` sub-directories
- `tabsOrder`: position of each tab (ordered array of the Ids of each tab node)
