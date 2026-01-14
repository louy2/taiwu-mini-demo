import numpy as np
from scipy.optimize import curve_fit

# Data
# X = Penetration / Resistance (Ratio)
# Y = Decay Rate (Multiplier)
x_data = [2.0, 4.0, 8.0, 10.0, 20.0, 40.0, 80.0, 100.0, 200.0, 400.0]
y_data = [0.862, 0.758, 0.610, 0.556, 0.385, 0.238, 0.135, 0.111, 0.059, 0.030]

# Model 1: Power Law y = a * x^b
def func_power(x, a, b):
    return a * np.power(x, b)

# Model 2: Michaelis-Menten Adaptation for Multiplier?
# Target = x * y. Let's model Target T(x).
# T(x) seems to saturate at 12.
# T(x) = Vmax * x / (K + x)
# y = T(x) / x = Vmax / (K + x)

def func_mm(x, vmax, k):
    return vmax / (k + x)

# Fit
try:
    popt_power, _ = curve_fit(func_power, x_data, y_data)
    print(f"Power Law: y = {popt_power[0]:.4f} * x^({popt_power[1]:.4f})")
except:
    print("Power fit failed")

try:
    popt_mm, _ = curve_fit(func_mm, x_data, y_data)
    print(f"MM Law: y = {popt_mm[0]:.4f} / ({popt_mm[1]:.4f} + x)")
except:
    print("MM fit failed")

# Calculate errors
def calc_error(func, params):
    y_pred = func(np.array(x_data), *params)
    mse = np.mean((y_pred - np.array(y_data))**2)
    return mse

print(f"Power MSE: {calc_error(func_power, popt_power)}")
print(f"MM MSE: {calc_error(func_mm, popt_mm)}")

# Check MM values
vmax = popt_mm[0]
k = popt_mm[1]
print("MM Values check:")
for x, y in zip(x_data, y_data):
    pred = vmax / (k + x)
    print(f"x={x}, y_real={y}, y_pred={pred:.3f}")
