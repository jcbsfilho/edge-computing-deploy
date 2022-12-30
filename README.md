# Edge Computing Deploy Action

This action was created to help deploy an edge application at Azion.
To use it, you need to create an account at [Azion](https://manager.azion.com/signup/) and use configuration files.

In this action, the Azion [CLI](https://www.azion.com/en/documentation/products/cli/overview/) is used to perform the deploy.

There is an example template in this repository:
  - [Example](https://)

## Inputs

### `personalToken`

Personal token created in RTM Azion.

**Required**

### `folder`

Folder where your application was built (Edge Function).

**Required**

## Outputs

### `message`

Deploy message.

## Example usage

```yml
uses: actions/edge-computing-deploy@v1
with:
  personalToken: ${{ secrets.PERSONAL_TOKEN }}
  folder: "./dist"
```  