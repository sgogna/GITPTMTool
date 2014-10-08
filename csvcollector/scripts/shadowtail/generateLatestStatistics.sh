DIR=$(dirname $(readlink -f $0))
ROOT="$DIR/../../../"

latest=`$ROOT/shadowtail/latest-log.sh $1`
$DIR/generateStatistics.sh $latest
