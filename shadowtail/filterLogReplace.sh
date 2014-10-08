DIR=$(dirname $(readlink -f $0))

File=$1
Start=$2
Stop=$3

if [ "$Start" == "" ] | [ "$Stop" == "" ];
 then
   echo "invalid start stop";
   exit;
fi

NewFile=$File".tmp"

$DIR/filterLog.sh $File "$Start" "$Stop" > $NewFile
mv $NewFile $File
$DIR/../csvcollector/scripts/shadowtail/generateStatistics.sh $File
