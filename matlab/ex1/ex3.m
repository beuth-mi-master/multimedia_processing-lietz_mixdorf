currentfolder = fileparts(which(mfilename));

sampleRate = 16000;

hFig = figure(1);
set(hFig, 'Position', [0 0 1500 1000])

fm_a_file = 'fmaulwurf-a.wav';
fm_i_file = 'fmaulwurf-i.wav';
md_a_file = 'mduve-a.wav';
md_i_file = 'mduve-i.wav';

sounds_list = {fm_a_file, fm_i_file, md_a_file, md_i_file};
framelength_list = [50 100 500 1000];

for i = 1:numel(sounds_list)
    current_file = sounds_list{i};
    current_sound = audioread(current_file);
    
    for j = 1:numel(framelength_list)
        current_frame_length = framelength_list(j);
        ft_sound = fft(current_sound, current_frame_length);
        delta_f = sampleRate/current_frame_length;
        f = (0:delta_f:sampleRate-delta_f);
        p = j + ((i - 1) * numel(sounds_list));
        subplot(numel(sounds_list),numel(framelength_list),p)
        plot(f, abs(ft_sound));
        current_title = strcat('frame length= ', int2str(current_frame_length), ', delta f= ', int2str(delta_f));
        title(current_title);
        legend(current_file);
        xlabel('f_{Hz}');
        ylabel('x_t');
    end
    
    % save plot as jpg
    saveas(gcf, 'plot13', 'jpg')
    
end