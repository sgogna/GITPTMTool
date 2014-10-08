#!/bin/bash

clear
TARGETS=""
TAG=""

TEST_ID=""
TEST_DIR=""
TEST_CONFIG=""

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
 read TARGETS;
}

checkTarget () {
 echo "checking targets: $TARGETS";
  
 local PREV_TARGETS=$TARGETS;
 
 local tarr=$(echo $TARGETS | tr ";" "\n")

  for target in $tarr
  do
  	local isValid=`$DIR/../../scripts/checkTarget.sh $target`
  	echo "target $target valid? $isValid";
  	if [ "$isValid" != "true" ]
  	then
  		TARGETS="";
  		echo "invalid target: "$PREV_TARGETS;
  	else 
  		echo "valid target: $target"
  	fi;
  done
}

checkTestId () {

if [ "$TEST_ID" = "" ]; then
 echo "invalid Test ID : $TEST_ID";
fi;

}

readTestId () {
 echo "enter your TEST_ID: (you should do this only when your session was disconnected! )";
 read TEST_ID;
}

checkValidateTestId () {

checkTestId;
while [ "$TEST_ID" = "" ]; do
 readTestId;
 checkTestId;
done;

TEST_DIR="$DIR/../../artifacts/tests/$TEST_ID";
TEST_CONFIG="$TEST_DIR/config.properties";
export TEST_ID="$TEST_ID";

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
while [ "$TARGETS" = "" ]; do
 readTarget;
 checkTarget;
done;
}

printTargetAndTag () {
 echo "targets: $TARGETS"
 echo "tag: $TAG";
 echo "test Id: $TEST_ID"; 
}

displayActiveProcesses () {
  
  updateDate;
  echo "dateTime: $date";
  echo "";
  echo "shadowtail  processes"
  ls -l  $DIR/../../shadowtail/pid/*;
  echo "";
  echo "thread dumps capture processes: "
  ls -l $DIR/../../threadDumpCapture/pid/*;

}

startHeapDumpCapture () {

local targets=$(echo $TARGETS | tr ";" "\n")
 for TARGET in $targets
   do 
   local TIERS=`$DIR/../../config/getProperty.sh $TARGET TIERS`;

  arr=$(echo $TIERS | tr ";" "\n")
  for tier in $arr
  do
    USER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.user"`
    SERVER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.server"`

    requestFile="$DIR/../work/requests/"$SERVER"."$USER"."$TARGET"."$tier"."$TAG"."$date".start.heapDumpCapture.reg";
    echo "cd ../heapDumpCapture" >> $requestFile;
    echo "export TEST_ID=\"$TEST_ID\"" >> $requestFile;
    echo "./start-heapDump-capture.sh $TARGET $tier $TAG" >> $requestFile;
    chmod a+rwx $requestFile;
  done
done

 goToRoot;
}

startThreadDumpCapture () {

local targets=$(echo $TARGETS | tr ";" "\n")
 for TARGET in $targets
   do 
   local TIERS=`$DIR/../../config/getProperty.sh $TARGET TIERS`;

  arr=$(echo $TIERS | tr ";" "\n")
  for tier in $arr
  do
    USER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.user"`
    SERVER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.server"`
    requestFile="$DIR/../work/requests/"$SERVER"."$USER"."$TARGET"."$tier"."$TAG"."$date".start.threadDumpCapture.reg";
    echo "processing TD	$tier $USER $SERVER";
    echo "cd ../threadDumpCapture" >> $requestFile;
    
    threadDumpsDir="artifacts/threadDumps/"$TARGET"-"$tier"/"$date"-"$TAG;
    $DIR/../../scripts/appendTestProperty.sh "$TEST_ID" "$TARGET.$tier.threadDumps" "$threadDumpsDir"
    
    echo "export TARGET_DIR=\"../$threadDumpsDir/\"" >> $requestFile;
    echo "./start-td-capture.sh "$TARGET" "$tier" $TAG 180" >> $requestFile;
    chmod a+rwx $requestFile;
  done
done

 goToRoot;
}

stopThreadDumpCapture () {

local targets=$(echo $TARGETS | tr ";" "\n")
 for TARGET in $targets
   do 
   local TIERS=`$DIR/../../config/getProperty.sh $TARGET TIERS`;

  arr=$(echo $TIERS | tr ";" "\n")
  for tier in $arr
  do
    USER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.user"`
    SERVER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.server"`

    requestFile="$DIR/../work/requests/"$SERVER"."$USER"."$TARGET"."$tier"."$TAG"."$date".stop.threadDumpCapture.reg";
    echo "cd ../threadDumpCapture" > $requestFile;
    echo "export TEST_ID=\"$TEST_ID\"" >> $requestFile;
    echo "./stop-td-capture.sh "$TARGET" "$tier >> $requestFile;
    chmod a+rwx $requestFile;
 done

done

 goToRoot;
}


startShadowtail () {

 local targets=$(echo $TARGETS | tr ";" "\n")
 for TARGET in $targets
   do 
   local TIERS=`$DIR/../../config/getProperty.sh $TARGET TIERS`;
   
  arr=$(echo $TIERS | tr ";" "\n")
  for tier in $arr
  do
    USER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.user"`
    SERVER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.server"`

    requestFile="$DIR/../work/requests/"$SERVER"."$USER"."$TARGET"."$tier"."$TAG"."$date".start.shadowtail.reg";
    echo "cd ../shadowtail" > $requestFile;
    echo "export TEST_ID=\"$TEST_ID\"" >> $requestFile;    
    echo "./start-shadowtail.sh "$TARGET $tier $TAG >> $requestFile;
    chmod a+rwx $requestFile;

 done
done

 goToRoot;
}

stopShadowtail () {

local targets=$(echo $TARGETS | tr ";" "\n")
 for TARGET in $targets
   do 
   local TIERS=`$DIR/../../config/getProperty.sh $TARGET TIERS`;
   
  arr=$(echo $TIERS | tr ";" "\n")
  for tier in $arr
  do
    USER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.user"`
    SERVER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.server"`

    requestFile="$DIR/../work/requests/"$SERVER"."$USER"."$TARGET"."$tier"."$TAG"."$date".stop.shadowtail.reg";
    echo "cd ../shadowtail" > $requestFile;
    echo "export TEST_ID=\"$TEST_ID\"" >> $requestFile;
    echo "./stop-shadowtail.sh "$TARGET $tier $TAG >> $requestFile;
    chmod a+rwx $requestFile;

  done
  
  done
  
  goToRoot;
}

restartServer () {

local targets=$(echo $TARGETS | tr ";" "\n")
 for TARGET in $targets
   do 
   local TIERS=`$DIR/../../config/getProperty.sh $TARGET TIERS`;

  arr=$(echo $TIERS | tr ";" "\n")
  for tier in $arr
  do
    USER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.user"`
    SERVER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.server"`

    requestFile="$DIR/../work/requests/"$SERVER"."$USER"."$TARGET"."$tier"."$TAG"."$date".restart.tomcat.reg";
    echo "../scripts/restartTomcat.sh $TARGET $tier $TAG" > $requestFile;
    chmod a+rwx $requestFile;

  done
  
  done
  goToRoot;
}

restartServerProfiling () {

  arr=$(echo $TIERS | tr ";" "\n")
  for tier in $arr
  do
    USER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.user"`
    SERVER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.server"`

    requestFile="$DIR/../work/requests/"$SERVER"."$USER"."$TARGET"."$tier"."$TAG"."$date".restart.tomcat.profiling.reg";
    echo "../scripts/restartTomcat-profiling.sh $TARGET $tier $TAG" > $requestFile;
    chmod a+rwx $requestFile;

  done
  goToRoot;
}

startCpuProfiling () {

  arr=$(echo $TIERS | tr ";" "\n")
  for tier in $arr
  do
    USER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.user"`
    SERVER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.server"`

    requestFile="$DIR/../work/requests/"$SERVER"."$USER"."$TARGET"."$tier"."$TAG"."$date".start.cpu.sampling.reg";
    echo "../profiling/yourkit/start-cpu-sampling.sh localhost 9999" > $requestFile;
    chmod a+rwx $requestFile;

  done
  goToRoot;
}

switchToMemoryProfiling () {

  arr=$(echo $TIERS | tr ";" "\n")
  for tier in $arr
  do
    USER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.user"`
    SERVER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.server"`

    requestFile="$DIR/../work/requests/"$SERVER"."$USER"."$TARGET"."$tier"."$TAG"."$date".switchToMemoryProfiling.reg";
    echo "../profiling/yourkit/switchCpuSamplingToMemoryAlloc.sh localhost 9999 $TARGET-$tier-$TAG" > $requestFile;
    chmod a+rwx $requestFile;

  done
  goToRoot;
}

captureMemorySnapshotStopProfiling () {

  arr=$(echo $TIERS | tr ";" "\n")
  for tier in $arr
  do
    USER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.user"`
    SERVER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.server"`

    requestFile="$DIR/../work/requests/"$SERVER"."$USER"."$TARGET"."$tier"."$TAG"."$date".captureMemorySnapshotStop.reg";
    echo "../profiling/yourkit/capture-memory-snapshot-stopProfiling.sh localhost 9999 $TARGET-$tier-$TAG" > $requestFile;
    chmod a+rwx $requestFile;

  done
  goToRoot;
}

cancelShadowtail () {

local targets=$(echo $TARGETS | tr ";" "\n")
 for TARGET in $targets
   do 
   local TIERS=`$DIR/../../config/getProperty.sh $TARGET TIERS`;

  arr=$(echo $TIERS | tr ";" "\n")
  for tier in $arr
  do
    USER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.user"`
    SERVER=`$DIR/../../config/getProperty.sh $TARGET "$tier\.server"`

    requestFile="$DIR/../work/requests/"$SERVER"."$USER"."$TARGET"."$tier"."$TAG"."$date".cancel.shadowtail.reg";
    echo "cd ../shadowtail" > $requestFile;
    echo "./cancel-shadowtail.sh "$TARGET"-"$tier >> $requestFile;
    chmod a+rwx $requestFile;

  done
  
  done
  goToRoot;
}

backupGcLogFiles () {
 cd "$DIR/../../gc";

 local targets=$(echo $TARGETS | tr ";" "\n")
 for TARGET in $targets
	do 
		./backup-gclog.sh $TARGET $TAG
  	done 

 goToRoot;
}

generateLatestCharts () {
 
 local targets=$(echo $TARGETS | tr ";" "\n")

 for TARGET in $targets
   do 
 
 cd "$DIR/../../scripts";
 ./generateLatestCharts.sh $TARGET $TAG;
 
 done
 
 goToRoot;
}

generateLatestAWR () {
 
 cd "$DIR/../../scripts";
 local targets=$(echo $TARGETS | tr ";" "\n")
 for TARGET in $targets
   do 
 	./generateLatestAWR.sh $TARGET $TAG;
 done
 
 goToRoot;
}

initializeTestProps () {
 TEST_DIR="$DIR/../../artifacts/tests/$TEST_ID";
 TEST_CONFIG="$TEST_DIR/config.properties";
}

startTest () {
 updateDate;

 TEST_ID="$date.$TARGET.$TAG";
 export TEST_ID="$TEST_ID"; 
 echo "generated testID:$TEST_ID";

 initializeTestProps;

 mkdir -p "$TEST_DIR";
 cp "$DIR/../../config/$TARGET.properties" "$TEST_DIR/$TARGET.properties"

 currDate=`date "+%Y-%m-%d %H:%M:%S"`

 
 echo "test.id=$TEST_ID" > $TEST_CONFIG;
 echo "test.target=$TARGETS" >> $TEST_CONFIG;
 echo "test.tag=$TAG" >> $TEST_CONFIG;
 echo "test.start=$currDate" >> $TEST_CONFIG;

 echo "starting shadowtail (remote)"
 startShadowtail;

 echo "starting thread dump capture (remote)"
 startThreadDumpCapture;

 
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
 
 currDate=`date "+%Y-%m-%d %H:%M:%S"`
 echo "test.cancel=$currDate" >> $TEST_CONFIG;

 mv -v "$TEST_DIR" $DIR/../../artifacts/tests/cancelled
 echo "Artifacts collection calnceled.";


}

stopTest () {
 
 currDate=`date "+%Y-%m-%d %H:%M:%S"`

 echo "stopping shadowtail (remote)"
 stopShadowtail;

 echo "stopping thread dump capture (remote)"
 stopThreadDumpCapture;

 echo "";
 echo "start heap dump capture (remote)"
 startHeapDumpCapture;

 echo "test.stop=$currDate" >> $TEST_CONFIG;

 echo "";
 echo "gc.log backup/report";
 backupGcLogFiles;

 echo "";
 echo "generating charts..."
 generateLatestCharts;

 echo "";
 generateLatestAWR;

 echo "All artifacts captured.";
 
}

showmenu () {
    goToRoot;
    printTargetAndTag;
    echo ""
    echo "Menu"

    echo "1) Start test (shadowtail, thread dumps)";
    echo "2) Stop test  (shadowtail, thread dumps, gc.log, eloggingCharts, heap dumps, AWR)";
    echo "3) Cancel test";

    echo "4) Change Target / Tag"
    echo "5) eLoggingCharts";
    echo "6) Shadowtail - Start"
    echo "7) Shadowtail - Stop"    
    echo "8) Thread Dump - Start"
    echo "9) Thread Dump - Stop"
    echo "10) Heap dumps T1/T2"
    echo "11) gc.log backup/report"
    echo "12) AWR report"
    echo "13) Display active processes";
    echo "14) Restart Tomcats";
    echo "15) Profiling";	
    echo "      15-A) Restart Tomcats - attach YJP agent (~3min)";
    echo "      15-B) Start CPU profiling";	
    echo "      15-C) Capture CPU snapshot & switch to memory profiling";
    echo "      15-D) Capture memory snapshot & stop memory profiling";
    echo "16) Change Test ID (only when you were disconnected)";
    echo "";
    echo "0) Quit"
}


###################################################################


menumode () {

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
              	hitButton;
                ;;
            2)
              	stopTest;
              	hitButton;
                ;;
            3)
              	cancelTest;
              	hitButton;
                ;;
            4)
              	changeTarget;
                ;;
            5)
              	generateLatestCharts;
              	hitButton;
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
                hitButton;
                ;;

            12)
               	generateLatestAWR;
               	hitButton;
                ;;
            13)
                displayActiveProcesses;
                hitButton;
                ;;
            14)
                restartServer;
                hitButton;
                ;;
            15-A)
                restartServerProfiling;
                hitButton;
                ;;
            15-B)
                startCpuProfiling;
                hitButton;
                ;;
            15-C)
                switchToMemoryProfiling;
                hitButton;
                ;;
            15-D)
                captureMemorySnapshotStopProfiling;
                hitButton;
                ;;
            16)
                TEST_ID="";
                checkValidateTestId;
                hitButton;
                ;;
            0)
                exit 0 ;;
            *)
                echo "Please enter number ONLY ranging from 1-4"
                ;;
    esac
done
}

if [ "$PTM_MODE" == "SILENT" ]
then
 echo "in silent mode";
 
 Command=$1;
 case "$Command" in
   "startTest")
   		TARGETS=$2;
 		TAG=$3;
 		checkValidateTarget;
		checkValidateTag;
 		startTest;
     exit 0 ;;
  "stopTest")
   		TEST_ID=$2;
   		echo "TestID:$TEST_ID"
   		checkValidateTestId;
   		initializeTestProps;
   		
   		TARGETS=`$DIR/../../scripts/getTestProperty.sh $TEST_ID test.target`;
 		TAG=`$DIR/../../scripts/getTestProperty.sh $TEST_ID test.tag`;
 		checkValidateTarget;
		checkValidateTag;
		
 		stopTest;
     exit 0 ;;
     
   "cancelTest")
   		TEST_ID=$2;
   		echo "TestID:$TEST_ID"
   		checkValidateTestId;
   		initializeTestProps;
   		
   		TARGETS=`$DIR/../../scripts/getTestProperty.sh $TEST_ID test.target`;
 		TAG=`$DIR/../../scripts/getTestProperty.sh $TEST_ID test.tag`;
 		checkValidateTarget;
		checkValidateTag;
 		cancelTest;
     exit 0 ;;
   *)
     echo "Invalid command"
   ;;
 esac

else
 
 TARGETS=$1;
 TAG=$2;
 menumode;
fi

