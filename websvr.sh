#!/bin/bash

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

PORT=8880
PORT=`echo $PORT$DIR|sed -e "s/^\(...\).*www\(.*\)/\1\2/"`
PORT=8087

if (( $# != 1 ))
then
	cd $DIR
	nodemon ./server.js $PORT
	exit 0
fi

mkdir ../www$1
chmod 777 ../www$1
cd ../www$1

ln -s ../www1/images ./images
ln -s ../www1/d3 ./d3

ln $DIR/websvr.sh websvr.sh
ln $DIR/index.js index.js
ln $DIR/index.js index.js
ln $DIR/model.js model.js
ln $DIR/requestHandlers.js requestHandlers.js
ln $DIR/router.js router.js
ln $DIR/server.js server.js
ln $DIR/favicon.ico favicon.ico

mkdir ./css
cp $DIR/index.html .
pushd ./css
cp $DIR/css/* .
popd

mkdir ./js
pushd ./js
cp $DIR/js/* .
popd

