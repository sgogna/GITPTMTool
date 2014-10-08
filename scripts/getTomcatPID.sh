INSTANCE=$1
/opt/mw/java/jdk1.7.0_06/bin/jps -lmv | grep inst$INSTANCE | head -n +1 | cut -d' ' -f 1
