hFig = figure(1);
set(hFig, 'Position', [0 0 800 1000])

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

framelength_list = [50 100 500 1000 5000];

for i = 1:numel(framelength_list)
    frame_length = framelength_list(i);
    fourier_sinemix = fft(sinemix, frame_length);
    delta_f = sampleRate/frame_length;
    f=(0:delta_f:sampleRate-delta_f);
    subplot(5,1,i)
    plot(f, abs(fourier_sinemix));
    current_title = strcat('frame length= ', int2str(frame_length), ', delta f= ', int2str(delta_f));
    title(current_title);
    xlabel('f_{Hz}'); 
    ylabel('x_t'); 
end

% save plot as jpg
saveas(gcf, 'plot_12', 'jpg')


