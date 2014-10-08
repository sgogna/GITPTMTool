TARGET=$1;
TAG=$2;

DIR=$(dirname $(readlink -f $0))

APP=`$DIR/../config/getProperty.sh $1 TIERS | tr ";" "\n" | head -n 1`
cd "$DIR"/../shadowtail
start=`./getLatestStartDate.sh $1"-$APP"`
end=`./getLatestEndDate.sh $1"-$APP"`
date=`echo "$start" | cut -d" " -f1`

cd ../AWR
./captureAWR.sh $TARGET $TAG "$start" "$end"
