DIR=$(dirname $(readlink -f $0))
CSV="$DIR/../"$1
ENTRY="/WEB-INF/jsp/landing.jsp"
VISITS=`grep -i $ENTRY $CSV | cut -d',' -f3`
STATS="/B6.myb/changeItinerary.html\|irop\|purchaseTravelExtrasAction\|/WEB-INF/jsp/landing.jsp\|ShoppingApi.purchase\|ShoppingApi.modifyReservation\|ShoppingApi.sendPassengerConfirmationEmail\|ShoppingApi.cancelBooking\|/B6.myb/bookingDetailsAjax.html\|/B6.myb/bookingDetails.html\|/B6.myb/fareRules.html\|/B6.myb/newSession.html\|/B6.myb/printItinerary.html\|/B6.myb/viewItinerary.html\|/WEB-INF/jsp/addFlightUpgrades.jsp\|WEB-INF/jsp/extras/purchase.jsp\|/B6.myb/manageSeats.html\|/WEB-INF/jsp/manageSeats/purchase.jsp"
#grep -i -f $DIR/myb_stats.txt $CSV | cut -d',' -f2-3 | awk -- '{print "line:" $0}'

cat $DIR/myb_stats.txt | while read line; do 

	COUNT=`grep $line $CSV | head -n 1 | cut -d',' -f3`
	if [ -z "$COUNT" ]; then
		COUNT="0"
	fi;
	echo $line","$COUNT | awk -vtotal=$VISITS -- 'BEGIN{FS=","}{print $2/total*100","$2","$1}'

done

#| awk -vtotal=$VISITS -- 'BEGIN{FS=","}{print $2/total*100","$2","$1}' | sort gr -t',' -k1 |  grep -v async
