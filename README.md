# Edge Computing Deploy Action

This action was created to help deploy an edge application at Azion.
To use it, you need to create an account at [Azion](https://manager.azion.com/signup/) and use configuration files.


There is an example template in this repository:

- [Example](https://github.com/jcbsfilho/edge-upstash-geolocation)

## Example usage

```yml
- name: edge-computing-deploy
  id: azion_edge
  uses: jcbsfilho/edge-computing-deploy@v3.0.0
  with:
    applicationName: "my-edge"
    azionPersonalToken: ${{ secrets.AZION_PERSONAL_TOKEN }}
    commitConfig: true
    functionFilePath: 'worker/function.js'
    argsFilePath: 'args.json'
    configFilePath: 'azion/azion.json'

- name: Get the output Azion Edge Deploy
  run: |
    echo "Application ID-= ${{ steps.azion_edge.outputs.applicationId }}"

```

## Inputs

### `applicationName`

Edge Application Name

**Optional**

> **Note**: if not provided, the name of the repo will be used.

### `azionPersonalToken`

Personal token created in RTM Azion.

**Required**

### `commitConfig`

default: false

Boolean to commit the settings for a new deploy.
Settings: domain id, edge application id, function id.

**Optional**

> **Note**: if your branch is protected this setting needs to be manually saved in your repo.

### `functionFilePath`

default: `worker/function.js`

your function's file path

**Optional**

### `functionArgsFilePath`

default: `args.json`

function file path of your arguments.
Indicated to be generated in your build.

> **Note**: no commit this file.

**Optional**

### `configFilePath`

default: `azion/azion.json`

file to save the id's information (edge application, function, domain)

**Optional**

## Outputs

### `applicationId`

Edge Application ID
