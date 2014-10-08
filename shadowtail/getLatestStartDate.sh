DIR=$(dirname $(readlink -f $0))
latest=`"$DIR"/latest-log.sh $1`
date=`head -n +2 $latest | tail -n 1 | cut -d" " -f1,2`
echo $date
