DIR=$(dirname $(readlink -f $0))
TEST_ID=$1;
Start=$2
Stop=$3
SERVER=`uname -n`

PTM_ENV=`$DIR/../config/getProperty.sh tools ptm.env.$SERVER`

if [ "$Start" == "" ] | [ "$Stop" == "" ];
 then
   echo "invalid start stop";
   exit;
fi

Tag=`$DIR/getTestProperty.sh $TEST_ID test.tag`
Target=`$DIR/getTestProperty.sh $TEST_ID test.target`

export TEST_ID="$TEST_ID";

$DIR/../AWR/captureAWR.sh $Target $Tag "$Start" "$Stop"

if [ "$PTM_ENV" != "" ]
then
	logFiles=`cat $DIR/../artifacts/$PTM_ENV/tests/$TEST_ID/config.properties | grep shadowtail.log`
else
	logFiles=`cat $DIR/../artifacts/tests/$TEST_ID/config.properties | grep shadowtail.log`
fi

for file in $logFiles
do
 path=`echo $file | cut -d'=' -f2`
 path="$DIR/../$path"
 echo $path 
 $DIR/../shadowtail/filterLogReplace.sh $path "$Start" "$Stop"
done

cd $DIR/../eLoggingCharts
./generateCharts.sh $Target $Tag "$Start" "$Stop"

