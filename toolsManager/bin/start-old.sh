#!/bin/bash

clear
TARGET=$1
TAG=$2

DIR=$(dirname $(readlink -f $0))
PERFORMANCE_ROOT="$DIR/../../../";
MANAGER_ROOT="$DIR/../";

updateDate () {
 date=`date +%Y-%m-%d_%H-%M-%S`;
}

updateDate;


goToRoot () {
 cd $MANAGER_ROOT;
}

hitButton () {
 echo "hit Enter to continue..."
 read x;
}

printSupportedTarget () {
 AVAILABLE_TARGETS=`$DIR/../../config/getProperty.sh tools TARGETS`
 arr=$(echo $AVAILABLE_TARGETS | tr ";" ",")
 echo "supported targets: $arr";
}

readTarget () {
 printSupportedTarget; 
 echo "Enter your target:";
 read TARGET;
}


checkTarget () {

AVAILABLE_TARGETS=`$DIR/../../config/getProperty.sh tools TARGETS`
arr=$(echo $AVAILABLE_TARGETS | tr ";" "\n")

if [[ -n "$TARGET" && ${arr[*]} =~ $TARGET ]]
 then
   
  AIRLINE=`$DIR/../../config/getProperty.sh $TARGET CARRIER`;
  TIERS=`$DIR/../../config/getProperty.sh $TARGET TIERS`;	
 else
   echo "invalid target: "$TARGET;
   TARGET="";
fi



}


checkTag () {

if [ "$TAG" = "" ]; then
 echo "invalid tag: $TAG";
fi;

}

readTag () {
 echo "enter rour tag: (word that will be used to tagg captured artifacts, no need to set Date, it's added automatically)";
 read TAG;
}

checkValidateTag () {
checkTag;
while [ "$TAG" = "" ]; do
 readTag;
 checkTag;
done;
}


checkValidateTarget () {
checkTarget;
while [ "$TARGET" = "" ]; do
 readTarget;
 checkTarget;
done;
}

printTargetAndTag () {
 echo "your target: $TARGET"
 echo "your tag: $TAG";
}

startHeapDumpCapture () {

  arr=$(echo $TIERS | tr ";" "\n")
  for tier in $arr
  do
    USER=`$DIR/../../config/getProperty.sh $TARGET $tier.user`
    SERVER=`$DIR/../../config/getProperty.sh $TARGET $tier.server`

    requestFile="work/requests/"$SERVER"."$USER"."$TARGET"."$TAG"."$date".start.heapDumpCapture.reg";
    echo "cd ../heapDumpCapture" >> $requestFile;
    echo "./start-heapDump-capture.sh $TARGET $tier $TAG" >> $requestFile;
    chmod a+rwx $requestFile;
  done

 goToRoot;
}

startThreadDumpCapture () {

  arr=$(echo $TIERS | tr ";" "\n")
  for tier in $arr
  do
    USER=`$DIR/../../config/getProperty.sh $TARGET $tier.user`
    SERVER=`$DIR/../../config/getProperty.sh $TARGET $tier.server`
    requestFile="work/requests/"$SERVER"."$USER"."$TARGET"."$TAG"."$date".start.threadDumpCapture.reg";
    echo "cd ../threadDumpCapture" >> $requestFile;
    echo "./start-td-capture.sh "$TARGET"-"$tier" $TAG 300" >> $requestFile;
    chmod a+rwx $requestFile;
  done

 goToRoot;
}

stopThreadDumpCapture () {

  arr=$(echo $TIERS | tr ";" "\n")
  for tier in $arr
  do
    USER=`$DIR/../../config/getProperty.sh $TARGET $tier.user`
    SERVER=`$DIR/../../config/getProperty.sh $TARGET $tier.server`

    requestFile="work/requests/"$SERVER"."$USER"."$TARGET"."$TAG"."$date".stop.threadDumpCapture.reg";
    echo "cd ../threadDumpCapture" > $requestFile;
    echo "./stop-td-capture.sh "$TARGET"-"$tier >> $requestFile;
    chmod a+rwx $requestFile;
 done

 goToRoot;
}


startShadowtail () {

  arr=$(echo $TIERS | tr ";" "\n")
  for tier in $arr
  do
    USER=`$DIR/../../config/getProperty.sh $TARGET $tier.user`
    SERVER=`$DIR/../../config/getProperty.sh $TARGET $tier.server`

    requestFile="work/requests/"$SERVER"."$USER"."$TARGET"."$TAG"."$date".start.shadowtail.reg";
    echo "cd ../shadowtail" > $requestFile;
    echo "./start-shadowtail.sh "$TARGET"-"$tier $TAG >> $requestFile;
    chmod a+rwx $requestFile;

 done

 goToRoot;
}

stopShadowtail () {

  arr=$(echo $TIERS | tr ";" "\n")
  for tier in $arr
  do
    USER=`$DIR/../../config/getProperty.sh $TARGET $tier.user`
    SERVER=`$DIR/../../config/getProperty.sh $TARGET $tier.server`

    requestFile="work/requests/"$SERVER"."$USER"."$TARGET"."$TAG"."$date".stop.shadowtail.reg";
    echo "cd ../shadowtail" > $requestFile;
    echo "./stop-shadowtail.sh "$TARGET"-"$tier $TAG >> $requestFile;
    chmod a+rwx $requestFile;

  done
  goToRoot;
}

cancelShadowtail () {

  arr=$(echo $TIERS | tr ";" "\n")
  for tier in $arr
  do
    USER=`$DIR/../../config/getProperty.sh $TARGET $tier.user`
    SERVER=`$DIR/../../config/getProperty.sh $TARGET $tier.server`

    requestFile="work/requests/"$SERVER"."$USER"."$TARGET"."$TAG"."$date".cancel.shadowtail.reg";
    echo "cd ../shadowtail" > $requestFile;
    echo "./cancel-shadowtail.sh "$TARGET"-"$tier >> $requestFile;
    chmod a+rwx $requestFile;

  done
  goToRoot;
}

backupGcLogFiles () {
 cd $PERFORMANCE_ROOT"/scripts";
 ./backup-gclog-$TARGET.sh $TAG
 hitButton;

 goToRoot;
}

generateLatestCharts () {
 cd ../../scripts;
 ./generateLatestCharts.sh $TARGET $TAG;
 hitButton;
 goToRoot;
}

startTest () {
 echo "starting shadowtail (remote)"
 startShadowtail;

 echo "starting thread dump capture (remote)"
 startThreadDumpCapture;

 hitButton;
}

changeTarget () {
 readTarget;
 checkValidateTarget;
 readTag;
 checkValidateTag;
}

cancelTest () {
 echo "cancelling shadowtail (remote)"
 cancelShadowtail;

 echo "stopping thread dump capture (remote)"
 stopThreadDumpCapture;

 echo "Artifacts collection calnceled.";

 hitButton;
}

stopTest () {
 echo "stopping shadowtail (remote)"
 stopShadowtail;

 echo "stopping thread dump capture (remote)"
 stopThreadDumpCapture;

 echo "";
 echo "start heap dump capture (remote)"
 startHeapDumpCapture;

 echo "";
 echo "gc.log backup/report";
 backupGcLogFiles;

 echo "";
 echo "generating charts..."
 generateLatestCharts;

 echo "All artifacts captured.";

 hitButton;
}

showmenu () {
    goToRoot;
    printTargetAndTag;
    echo ""
    echo "Menu"
    echo "1) Start test (shadowtail, thread dumps)";
    echo "2) Stop test  (shadowtail, thread dumps, gc.log, eloggingCharts, heap dumps)";
    echo "3) Cancel test";

    echo "4) Change Target / Tag"
    echo "5) eLoggingCharts";
    echo "6) Shadowtail - Start"
    echo "7) Shadowtail - Stop"    
    echo "8) Thread Dump - Start"
    echo "9) Thread Dump - Stop"
    echo "10) Heap dumps T1/T2"
    echo "11) gc.log backup/report"
    echo "";
    echo "0) Quit"
}


###################################################################


checkValidateTarget;
checkValidateTag;

while true ; do
    clear;
    showmenu;
    read choice;
    updateDate;
    case "$choice" in


	    1)
		startTest;
		;;
	    2)
		stopTest;
		;;
	    3)
		cancelTest;
		;;
	    4)
		changeTarget;
		;;
	    5) 
		generateLatestCharts;
		;;
	    
	    6)
		startShadowtail;
		;;
	    7)
		stopShadowtail;
		;;
	    8)
		startThreadDumpCapture;
		;;
	    9)
		stopThreadDumpCapture;
		;;
	    10)
		startHeapDumpCapture;
		hitButton;
		;;
	   11)
		backupGcLogFiles;
		;;
	    0)
		exit 0 ;;
	    *)
		echo "Please enter number ONLY ranging from 1-4"
		;;
    esac
done
