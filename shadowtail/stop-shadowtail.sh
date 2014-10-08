DIR=$(dirname $(readlink -f $0))

TARGET=$1
TIER=$2
TARGETTIER="$1-$2"

date=`date "+%Y-%m-%d %H:%M:%S"`
host=`uname -n`
user=`whoami`

PTM_ENV=`$DIR/../config/getProperty.sh tools ptm.env.$host`


file="pid/$host.$user.$TARGETTIER.pid";
if [ -f $file ]; then
 processId=`head -n 1 $file`
 echo "$date killing shadowtail $TARGETTIER, pid: $processId"
 echo "$date killing shadowtail $TARGETTIER, pid: $processId" >> logs/start-stop.log
 kill -9 $processId >> logs/start-stop.log
 rm $file >> logs/start-stop.log
 $DIR/../csvcollector/scripts/shadowtail/generateLatestStatistics.sh "$TARGETTIER"

 log=`$DIR/latest-log.sh $TARGETTIER | awk -F"/" -- '{print $NF}'`
 #$DIR/../scripts/appendTestProperty.sh "$TEST_ID" "$TARGET.$TIER.shadowtail.log" "artifacts/$PTM_ENV/shadowtail/$TARGETTIER/$log" 
 $DIR/../scripts/appendTestProperty.sh "$TEST_ID" "$TARGET.$TIER.shadowtail.report" "artifacts/$PTM_ENV/shadowtail/$TARGETTIER/$log.report.csv"

fi;
