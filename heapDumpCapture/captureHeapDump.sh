#!/bin/bash

PID=$1
FILE=$2
EMAIL=$3
DIR=$(dirname $(readlink -f $0))
JDK_HOME=`$DIR/../config/getProperty.sh tools JDK_HOME`


echo "capturing PID: $PID"
$JDK_HOME/bin/jmap -dump:live,file=$FILE $PID

chmod a+rwx $FILE
ls -lh $FILE

echo "compressing ..."
gzip -6 $FILE

ls -lh $FILE".gz"
echo "heap dump capture complete";

if [ -n "$EMAIL" ]; then
  ls -lh $FILE".gz" | mutt -s "heap dump capture complete: $FILE.gz" $EMAIL
fi;

