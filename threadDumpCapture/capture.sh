#!/bin/bash
TARGETPID=$1
TARGET=$2
TAG=$3

host=`uname -n`
user=`whoami`
date=`date "+%Y%m%d_%H%M%S"`
DIR=$(dirname $(readlink -f $0))

JDK_HOME=`$DIR/../config/getProperty.sh tools jdk.home.$host`

if [ "$TARGET_DIR" != "" ] ; then
  echo "dumping to $TARGET_DIR";
  if [ ! -d "$TARGET_DIR" ]
  then
   echo "creating target dir: $TARGET_DIR"
    mkdir -p "$TARGET_DIR";
  fi 
else
 TARGET_DIR="capture/$TARGET/";
fi

file="$TARGET_DIR/$TARGET."$host"."$user"."$date"."$TAG"."$PPID".txt";
echo "capturing $TARGET $TARGETPID"
$JDK_HOME/bin/jstack -l $TARGETPID > $file
chmod a+rwx $file
##gzip $file
