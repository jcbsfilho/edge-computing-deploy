#!/bin/sh -l

message="completed"

if [ ! -d "./azion" ]; then
  echo "Folder /azion does not exist."
  exit 1
fi

azioncli configure --token $1

if [ ! -d "$2" ]; then
  echo "Folder $2 does not exist."
  exit 1
fi

RESULT_PUBLISH=$(azioncli webapp publish)

if [[ "$RESULT_PUBLISH" == .*"Error".* ]]; then
  echo "$RESULT_PUBLISH"
  exit 1
fi

echo "$RESULT_PUBLISH"

# echo $(jq -r '.name' ./azion/azion.json)
echo "message=$message" >> $GITHUB_OUTPUT