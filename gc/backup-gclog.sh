echo "Needs to run from sswhli474"
TARGET=$1
TAG="$2"

# String dateStartString = System.getProperty("filter.date.start");
# String dateStopString = System.getProperty("filter.date.stop");
# String datePattern = System.getProperty("filter.date.pattern");

echo "test id: $TEST_ID";

DIR=$(dirname $0)
validTarget=`$DIR/../scripts/checkTarget.sh $TARGET`
JDK_HOME=`$DIR/../config/getProperty.sh tools JDK_HOME`
		
if [ "$validTarget" == "true" ] 
     then
	 TIERS=`$DIR/../config/getProperty.sh $TARGET TIERS`;
	 echo "Airline :$AIRLINE , Tiers:$TIERS"
	 arr=$(echo $TIERS | tr ";" "\n")
  for tier in $arr
  do
	gclog=`"$DIR/../"scripts/getGcLocation.sh $TARGET $tier.gclog.location`
	echo gclogs ::::: $gclog
	mail=`$DIR/../config/getProperty.sh $TARGET EMAIL_REPORT_ADDRESS`
	gclog=`ls -t $gclog* | grep -v backup | head -n 1`
	if [ "$gclog" == "" ]
		then
			echo "missing gc.log config for $TARGET-$tier";
		else
			$DIR/backup-gclog-generic.sh $TARGET $tier $gclog $TARGET"_"$tier"_"$TAG $mail
		fi	
	done
else
        echo "invalid targe";
fi
