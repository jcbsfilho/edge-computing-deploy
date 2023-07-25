# Edge Computing Deploy Action

This action was created to help deploy an edge application at Azion.
To use it, you need to create an account at [Azion](https://manager.azion.com/signup/) and use configuration files.

There is an example template in this repository:

- [Example](https://github.com/jcbsfilho/azion-samples)

## Example usage

```yml
- name: edge-computing-deploy
  id: azion_edge
  uses: jcbsfilho/edge-computing-deploy@v4.0.0
  with:
    azionPersonalToken: ${{ secrets.AZION_PERSONAL_TOKEN }}
    functionArgsFilePath: "args.json"
    buildPreset: "angular"
    buildMode: "deliver"

- name: Get the output Azion Edge Deploy
  run: |
    echo "Application ID-= ${{ steps.azion_edge.outputs.applicationId }}"
    echo "Domain-= ${{ steps.azion_edge.outputs.domainUrl }}"
```

## Inputs

### `applicationName`

Edge Application Name

**Optional**

> **Note**: if not provided, the name of the repo will be used.

### `azionPersonalToken`

Personal token created in RTM Azion.

**Required**

### `functionArgsFilePath`

default: `args.json`

function file path of your arguments.
Indicated to be generated in your build.

> **Note**: no commit this file.

**Optional**

### `buildPreset`

Build preset by Vulcan ex: angular

```bash

  azioncli edge_applications ls

  PRESET      MODE     
  Html        Deliver  
  Javascript  Compute  
  Typescript  Compute  
  Angular     Deliver  
  Astro       Deliver  
  Hexo        Deliver  
  Next        Deliver  
  React       Deliver  
  Vue         Deliver 

```

**Required**


### `buildMode`

Build mode by Vulcan ex: deliver

```bash

  azioncli edge_applications ls

  PRESET      MODE     
  Html        Deliver  
  Javascript  Compute  
  Typescript  Compute  
  Angular     Deliver  
  Astro       Deliver  
  Hexo        Deliver  
  Next        Deliver  
  React       Deliver  
  Vue         Deliver 

```

**Required**

## Outputs

### `applicationId`

Edge Application ID

### `domainUrl`

Edge Application Domain
