PID=$1
JDK_HOME=`$DIR/../config/getProperty.sh tools JDK_HOME`
$JDK_HOME/bin/jstat -gc $PID | tail -n 1 | xargs | cut -d' ' -f2,3,6,8 | awk 'BEGIN{FS=" "}{print ($1+$2+$3+$4)/1024};'
