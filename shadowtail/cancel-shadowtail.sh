#!/bin/bash
date=`date "+%Y-%m-%d %H:%M:%S"`
host=`uname -n`
user=`whoami`
file="pid/"$host"."$user"."$1".pid";
if [ -f $file ]; then
 PID=`head -n 1 $file`
 search=`ps $PID | tail -n 1 | xargs`;
 PID2=`echo $search | cut -d' ' -f1`;

 if [ "$PID" = "$PID2" ]; then
	echo "$date killing shadowtail $1, pid: $PID"
 	kill -9 $PID
 	rm pid/$host.$user.$1.pid
 	latest=`./latest-log.sh $1`
 	latest=$(readlink -f $latest)
 	echo "deleting latest file: $latest"
 	rm "$latest"
 else
   echo "The process is not running: "$PID;
   rm $file;
 fi

fi;
