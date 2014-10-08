DIR=$(dirname $(readlink -f $0))
latest=`"$DIR"/latest-log.sh $1`
date=`tail -n 1 $latest | cut -d" " -f1,2`
echo $date

