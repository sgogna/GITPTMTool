TARGET=$1
TIER=$2
TARGETTIER="$TARGET-$TIER"
gcLogLocation=$3
suffix=$4
CCList=$5
SERVER=`uname -n`
DIR=$(dirname $0)

day=`date +%Y-%m-%d`
time=`date +%H-%M-%S`
date=`date +%Y-%m-%d_%H-%M-%S`

PTM_ENV=`$DIR/../config/getProperty.sh tools ptm.env.$SERVER`

echo "PTM_ENV backuploggeneric.sh ::: " $PTM_ENV;


if [ "$PTM_ENV" != "" ]
then
	gcLogBackup="$DIR/../artifacts/$PTM_ENV/gcLogs/$TARGETTIER/gc.log.backup."$day"."$time"."$suffix".log"
else
	gcLogBackup="$DIR/../artifacts/gcLogs/$TARGETTIER/gc.log.backup."$day"."$time"."$suffix".log"
fi
gcLogBackupOld=$gcLogLocation".backup."$day"."$time"."$suffix".log"

gcLogReport=$gcLogBackup".report.txt"

gcLogEmailTitle="gc.log report - "$suffix" - "$day" "$time
gcLogBackupArchive=$gcLogBackup".gz"

cp -v $gcLogLocation $gcLogBackup

$DIR/generateReport.sh $gcLogBackup

gzip -9 $gcLogBackup

echo | mutt -a $gcLogReport -s "$gcLogEmailTitle" $CCList

# PTM TEST ARTIFACTS
if [ "$PTM_ENV" != "" ]
then
	$DIR/../scripts/appendTestProperty.sh "$TEST_ID" "$TARGET.$TIER.gcLog.backup" "artifacts/$PTM_ENV/gcLogs/$TARGETTIER/gc.log.backup."$day"."$time"."$suffix".log.gz"
	$DIR/../scripts/appendTestProperty.sh "$TEST_ID" "$TARGET.$TIER.gcLog.report" "artifacts/$PTM_ENV/gcLogs/$TARGETTIER/gc.log.backup."$day"."$time"."$suffix".log.report.txt"
else
	$DIR/../scripts/appendTestProperty.sh "$TEST_ID" "$TARGET.$TIER.gcLog.backup" "artifacts/gcLogs/$TARGETTIER/gc.log.backup."$day"."$time"."$suffix".log.gz"
	$DIR/../scripts/appendTestProperty.sh "$TEST_ID" "$TARGET.$TIER.gcLog.report" "artifacts/gcLogs/$TARGETTIER/gc.log.backup."$day"."$time"."$suffix".log.report.txt"
fi