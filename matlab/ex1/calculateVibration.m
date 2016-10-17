function a = calculateVibration(A, f, phi, t)
    a = A * sin(2 * pi * f * t + phi);
end
