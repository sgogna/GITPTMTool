DIR=$(dirname $(readlink -f $0))
APP=`$DIR/../config/getProperty.sh $1 TIERS | tr ";" "\n" | head -n 1`
PRODUCT=`$DIR/../config/getProperty.sh $1 PRODUCT | tr ";" "\n" | head -n 1`
echo "PRODUCT :::: " $PRODUCT
cd "$DIR"/../shadowtail
start=`./getLatestStartDate.sh $1"-$APP"`
end=`./getLatestEndDate.sh $1"-$APP"`
date=`echo "$start" | cut -d" " -f1`
cd ../eLoggingCharts
./generateCharts.sh $1 $2 "$start" "$end"