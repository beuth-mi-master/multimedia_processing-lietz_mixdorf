function x = ex2(sampleRate, sinemix)
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
    saveas(gcf, 'plot_ft', 'jpg')

end



