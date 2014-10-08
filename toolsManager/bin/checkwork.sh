#!/bin/bash

host=`uname -n`
user=`whoami`
prefix=$host"."$user;
logfile="work/logs/"$prefix".log"
for req in work/requests/$prefix.*; 
do 
 if [ -f $req ]; then
	date=`date "+%Y-%m-%d %H:%M:%S"`
	echo $date" Start executing request: "$req >> $logfile
        filename=`ls $req | xargs basename`
	mv $req work/inprogress/;
	work/inprogress/$filename >> $logfile; 
	mv work/inprogress/$filename work/completed/ >> $logfile;
	date=`date "+%Y-%m-%d %H:%M:%S"`
        echo $date" Completed request: "$req >> $logfile
 fi;
done;
