TARGET=$1
TIER=$2
TARGETTIER="$1-$2"
TAG=$3
host=`uname -n`
user=`whoami`
date=`date "+%Y-%m-%d %H:%M:%S"`
file="pid/$host.$user.$TARGETTIER.pid";

if [ -z "$TAG" ] ; then
  echo "target not set";
  TAG="test";
fi

if [ -f $file ] ; then
 echo "checking file: $file";
 PID=`cat $file`;
 search=`ps $PID | tail -n 1 | xargs`;
 PID2=`echo $search | cut -d' ' -f1`;

 if [ "$PID" = "$PID2" ]; then
        echo "The process is already running: $search";
        exit 0;
 else
   echo "The process is not running: "$PID;
   rm $file;
 fi
fi

DIR=$(dirname $(readlink -f $0))
JDK_HOME=`$DIR/../config/get-jdk-home.sh`
echo "PTM_ENV start Shadowtail ::: " $PTM_ENV;

"$JDK_HOME"bin/java -classpath lib/*:configs -Dptm.env=$PTM_ENV -Dconfig.tag=$TAG com.sabre.shadowtail.Startup "configs/$TARGETTIER.xml" &

PID=$!
echo $PID > "$file"
echo $date" started shadowtail $1, pid: $PID"
echo $date" started shadowtail $1, pid: $PID" >> logs/start-stop.log
sleep 10
log=`$DIR/latest-log.sh $TARGETTIER | awk -F"/" -- '{print $NF}'`
$DIR/../scripts/appendTestProperty.sh "$TEST_ID" "$TARGET.$TIER.shadowtail.log" "artifacts/$PTM_ENV/shadowtail/$TARGETTIER/$log"
