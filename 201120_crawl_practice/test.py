# -*- coding: utf-8 -*-
from selenium import webdriver
driver = webdriver.Chrome('./chromedriver')
driver.implicitly_wait(3)
driver.get('http://www.segye.com/newsView/20201120509191')

title = driver.find_element_by_xpath('//*[@id="title_sns"]')
subject = driver.find_element_by_xpath('//*[@id="article_txt"]/article/p[1]')
print(title.text)
print(subject.text)
