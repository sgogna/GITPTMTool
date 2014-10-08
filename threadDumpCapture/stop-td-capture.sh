DIR=$(dirname $(readlink -f $0))

TARGET=$1
TIER=$2
APP="$TARGET-$TIER"

host=`uname -n`
user=`whoami`

PID=`cat pid/$host.$user.$APP.pid`
echo "killing thread dump loop capture: $PID"
kill  $PID;
rm pid/$host.$user.$APP.pid;
if [ "$TEST_ID" != "" ] ; then
 folder=`$DIR/../scripts/getTestProperty.sh "$TEST_ID" "$TARGET.$TIER.threadDumps"`
 folder="$DIR/../$folder/"
 cd $folder; 
 pwd;
 grep -c BLOCKED *.txt | grep -v ":0" > "blocked.txt" 
fi
