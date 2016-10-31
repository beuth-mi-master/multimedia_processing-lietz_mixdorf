currentfolder = fileparts(which(mfilename));
outputfile = strcat(currentfolder, '/sine.wav');

% sample rate (16kHz)
sampleRate = 16000;

% sampling period (0.0000625s) 
samplePeriod = 1/sampleRate;

% time
timeInMS = 5;

% length of signal (5s) 
time = (0:samplePeriod:timeInMS-samplePeriod);

% create sine vibrations
vibration1 = calculateVibration(1, 100, 0, time);
vibration2 = calculateVibration(0.5, 200, -pi/2, time);
vibration3 = calculateVibration(0.5, 400, pi, time);

% mix sine vibrations and scale sinemix
sinemix = vibration1 + vibration2 + vibration3;
sinemix = sinemix/max(abs(sinemix));

% plotting sinemix
plot(time, sinemix);
axis([0 0.02 -1 1]);
xlabel('t_s'); 
ylabel('x_t'); 

% save plot as jpg
saveas(gcf, 'plot_11', 'jpg')

% write to wav-file
audiowrite(outputfile, sinemix, sampleRate)
