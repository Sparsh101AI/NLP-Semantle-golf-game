import wikiScrapper;

epochs = 100

lines = open("articleNames.txt").readlines()
for i in range(65, len(lines)-1):
    scraper = wikiScrapper.LoopScraper("https://en.wikipedia.org/wiki/" + lines[i].strip())
    scraper.start(epochs=epochs)
    scraper.exportAsFiles()