# Early Warning System Framework 
A simple web-based simulator for the framework for a potential Early warning system (EWS) designed to detect Flooding in Limestone aquifer regions before it occurs, and issue warnings to residents based on the threat level. 

This project is being developed in aid of the completion of our final project for the Bachelors of Engineering in Construction at the University of Technology, Jamaica on the topic *Developing a Framework for an Early Warning System for Limestone Aquifers Regions Prone to Groundwater Flooding: A Case Study of Content Manchester*. 

The framework takes heavy inspiration from a project of a similar nature completed by user [8DUINOide](#), which is a similar flood monitoring system based on river flow, built for naga city in the Philippines. 

## Features

1) Interactive map with clickable areas and markers

2) Markers for all the Boreholes located around the Content Aquifer zone taken from the WRA Report 2026 report and our interviews with the WRA team that would have visited the site prior to the flooding from Hurricane Melissa (2025)

3) Markers for Automated Weather Systems (AWS) located around the area 

4) Markers for emergency shelters, plus current weather conditions (temperature, wind, pressure etc.) for each location, currently sourced from Open-Meteo

5) Four Alert levels set for Safe (Green), Watch (Yellow), Alert (Orange), Critical (Red) determining the warnings residents would receive

6) A forecast simulation tracker that lets users import CSV data from GEOGLOWS for a chosen river segment and simulate the threat level over the given time period

## How to Run?

Click the link provided below all the features are presented in a fashion that should be somewhat familiar if you've used apps like Google maps or Apple Maps. 
The forecast simulation feature requires you to first download the CSV data for the river segment you want to simulate from GEOGLOWS, then import it into the site.

**Link:** https://mckenzieantonio29-del.github.io/Flood-Early-Warning-jamaica/

## Future Enhancements


The current design is meant to demonstrate what is possible with limited coding experience. There are many areas the system could be improved with more funding and/or the involvement of someone with greater technical expertise.

The biggest barrier for the system functioning effectively in the future is communication between the different channels. It would need coordinated support from bodies such as the Water Resource Authority (WRA), the Meteorological Service of Jamaica (MSJ), the Jamaica Fire Brigade, the Office of Disaster Preparedness (ODPEM), and the various municipal organisations across the different parishes.
