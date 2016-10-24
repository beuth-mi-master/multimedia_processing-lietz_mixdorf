function x = ex1(sampleRate, sinemix, time, outputfile)
    % plotting sinemix
    plot(time, sinemix);
    axis([0 0.02 -1 1]);
    xlabel('t_s'); 
    ylabel('x_t'); 

    % save plot as jpg
    saveas(gcf, 'plot', 'jpg')

    % write to wav-file
    audiowrite(outputfile, sinemix, sampleRate)
end
